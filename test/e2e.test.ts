import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import { db, initializeDatabase, seedDemoData } from '../server/src/db/storage.js';
import { extractTextFromFile, chunkDocumentText, extractStructuredFacts, applyApprovedFactsToCase } from '../server/src/services/documentService.js';
import { matchAndRankAdvocates } from '../server/src/services/matchingService.js';
import { askGeneralLegalQuestion, askDocumentQuestion } from '../server/src/services/aiService.js';

async function runTests() {
  console.log('--- NEXTGEN JUSTICE V8 AUTOMATED TEST SUITE ---');
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    try {
      fn();
      console.log(`✓ [PASS] ${name}`);
      passed++;
    } catch (e: any) {
      console.error(`✗ [FAIL] ${name}:`, e.message);
      failed++;
    }
  }

  async function testAsync(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`✓ [PASS] ${name}`);
      passed++;
    } catch (e: any) {
      console.error(`✗ [FAIL] ${name}:`, e.message);
      failed++;
    }
  }

  // 1. Database Initialization & Seeding
  await testAsync('Database initializes and seeds at least 30 Tamil Nadu advocates', async () => {
    await initializeDatabase();
    const advCount = db.advocates.count();
    assert(advCount >= 30, `Expected at least 30 advocates, got ${advCount}`);

    // Verify key districts are present
    const districts = db.advocates.find().map((a) => a.district);
    const required = ['Madurai', 'Chennai', 'Coimbatore', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Virudhunagar', 'Thoothukudi', 'Dindigul', 'Sivaganga', 'Theni'];
    for (const req of required) {
      assert(districts.includes(req), `Missing required Tamil Nadu district: ${req}`);
    }
  });

  // 2. Advocate Matching Engine
  test('Advocate matching produces transparent scores and explanations for Madurai', () => {
    const results = matchAndRankAdvocates({
      state: 'Tamil Nadu',
      district: 'Madurai',
      practiceArea: 'Property',
    });

    assert(results.length > 0, 'Expected matching advocates');
    const top = results[0];
    assert(top.matchScore > 50, `Expected top match score > 50, got ${top.matchScore}`);
    assert(top.matchExplanation, 'Expected match explanation object');
    assert(top.matchExplanation.practiceAreaMatch.includes('/35'), 'Expected practice score breakdown');
    assert(top.matchExplanation.locationMatch.includes('/30'), 'Expected location score breakdown');
    assert(top.district === 'Madurai', 'Top match should be in Madurai');
  });

  // 3. Document AI: Text Extraction
  await testAsync('Text extraction parses plain text notices correctly', async () => {
    const fixturePath = path.resolve('test-fixtures/sample_legal_notice.txt');
    assert(fs.existsSync(fixturePath), 'Test fixture must exist');

    const result = await extractTextFromFile(fixturePath, 'text/plain', 'sample_legal_notice.txt');
    assert(result.text.length > 100, 'Extracted text should not be empty');
    assert(result.text.includes('Arumugam Chettiar'), 'Should contain landlord name');
    assert(result.text.includes('Saravanan Trading Corporation'), 'Should contain tenant name');
    assert(result.text.includes('1,40,000'), 'Should contain rental arrears');
  });

  // 4. Document AI: Chunking
  test('Chunker creates overlapping retrieval chunks retaining metadata', () => {
    const sample = 'LEGAL NOTICE. '.repeat(100);
    const chunks = chunkDocumentText(sample, 200, 50);
    assert(chunks.length > 1, 'Should create multiple chunks');
    assert(chunks.every((c) => c.length > 0), 'Chunks must be non-empty');
  });

  // 5. Document AI: Fact Extraction
  test('Structured Fact Extraction detects document type, parties, and statutory sections', () => {
    const fixturePath = path.resolve('test-fixtures/sample_legal_notice.txt');
    const text = fs.readFileSync(fixturePath, 'utf-8');

    const facts = extractStructuredFacts(text, 'sample_legal_notice.txt');
    assert(facts.documentType?.includes('Section 106'), `Expected Sec 106 notice type, got ${facts.documentType}`);
    assert(facts.parties && facts.parties.length >= 2, 'Expected at least 2 parties');
    assert(facts.claimsOrDemands && facts.claimsOrDemands.length > 0, 'Expected claims or demands');
    assert(facts.courtOrAuthority?.includes('Madurai'), 'Expected Madurai authority');
  });

  // 6. Case Persistence & Fact Merging
  test('Extracted facts merge into authoritative case record without loss', () => {
    const testCase = db.cases.findOne((c) => c._id === 'case_01');
    assert(testCase, 'Case 01 should exist');

    const mergeResult = applyApprovedFactsToCase('doc_01', 'case_01', testCase.citizenId);
    assert(mergeResult.success, 'Merge should succeed');
    assert(mergeResult.case.extractedFactsSummary, 'Case should have extracted facts summary');
  });

  // 7. Mode A: Legal AI Assistant General Questions
  await testAsync('Legal Assistant Mode A answers basic Indian legal concepts with citations', async () => {
    const res = await askGeneralLegalQuestion('What is the difference between a civil case and a criminal case?', 'en');
    assert(res.hasSufficientEvidence, 'Should have sufficient evidence');
    assert(res.answer.includes('Civil') && res.answer.includes('Criminal'), 'Answer should discuss both');
    assert(res.statutoryReferences && res.statutoryReferences.length > 0, 'Should cite statutes');
  });

  // 8. Mode B: Grounded Private Document RAG
  await testAsync('Legal Assistant Mode B retrieves relevant chunks and cites sources from case documents', async () => {
    const testCase = db.cases.findOne((c) => c._id === 'case_01');
    assert(testCase, 'Case 01 should exist');

    const res = await askDocumentQuestion(testCase.citizenId, 'What rental arrears amount is demanded?', {
      caseId: testCase._id,
      documentId: 'doc_01',
    });

    assert(res.hasSufficientEvidence, 'Should have matching document evidence');
    assert(res.sources.length > 0, 'Should return grounded sources');
    assert(res.sources[0].excerpt.includes('1,40,000') || res.answer.includes('1,40,000'), 'Should find the 1,40,000 figure in excerpts');
  });

  // 9. Negative RAG Test: Insufficient Evidence Handling
  await testAsync('Legal Assistant Mode B reports insufficient evidence when document does not mention topic', async () => {
    const testCase = db.cases.findOne((c) => c._id === 'case_01');
    assert(testCase, 'Case 01 should exist');

    const res = await askDocumentQuestion(testCase.citizenId, 'What is the nuclear submarine warranty clause?', {
      caseId: testCase._id,
      documentId: 'doc_01',
    });

    assert(res.hasSufficientEvidence === false, 'Should flag insufficient evidence');
    assert(res.answer.includes('insufficient relevant evidence') || res.sources.length === 0, 'Should not hallucinate submarine clause');
  });

  // 10. Consultation Request Lifecycle
  test('Consultation request is stored with PENDING status and can be updated', () => {
    const req = db.consultations.create({
      _id: `con_test_${Date.now()}`,
      citizenId: 'usr_citizen_01',
      advocateId: 'adv_01',
      message: 'Urgent eviction consultation test',
      mode: 'IN_PERSON',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    assert(req._id, 'Consultation record created');
    assert(req.status === 'PENDING', 'Initial status should be PENDING');

    const updated = db.consultations.update(req._id, {
      status: 'ACCEPTED',
      responseNote: 'Chamber appointment confirmed for Monday 10:00 AM.',
    });

    assert(updated?.status === 'ACCEPTED', 'Status should be ACCEPTED');
    assert(updated?.responseNote?.includes('Monday'), 'Response note persisted');
  });

  console.log(`\n========================================`);
  console.log(`TEST RUN COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});
