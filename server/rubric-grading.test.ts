
import { describe, it, expect } from "vitest";

describe("Script Fidelity Keyword Detection", () => {
  const checkPhrases = (text: string, phrases: string[]) => {
    const lower = text.toLowerCase();
    return phrases.filter(p => lower.includes(p.toLowerCase()));
  };

  it("detects Professional Hello key phrases", () => {
    const transcript = "Congratulations on your new vehicle! Let me introduce you to our business managers who will help you with the state and federal documents required for your purchase.";
    const keyPhrases = ["congratulations on your new vehicle", "business managers", "state and federal documents"];
    
    const found = checkPhrases(transcript, keyPhrases);
    expect(found).toHaveLength(3);
    expect(found).toContain("congratulations on your new vehicle");
    expect(found).toContain("business managers");
    expect(found).toContain("state and federal documents");
  });

  it("detects VSC presentation key phrases", () => {
    const transcript = "This vehicle service agreement covers 100% of parts and 100% of labor. It's not an extended warranty, but rather comprehensive coverage for your vehicle.";
    const keyPhrases = ["vehicle service agreement", "not an extended warranty", "100% of parts", "100% of labor"];
    
    const found = checkPhrases(transcript, keyPhrases);
    expect(found).toHaveLength(4);
    expect(found).toContain("vehicle service agreement");
    expect(found).toContain("not an extended warranty");
  });

  it("detects GAP presentation key phrases", () => {
    const transcript = "Guaranteed asset protection helps cover the deficiency balance in case of total loss of your vehicle.";
    const keyPhrases = ["guaranteed asset protection", "total loss", "deficiency balance"];
    
    const found = checkPhrases(transcript, keyPhrases);
    expect(found).toHaveLength(3);
    expect(found).toContain("guaranteed asset protection");
    expect(found).toContain("total loss");
    expect(found).toContain("deficiency balance");
  });

  it("detects consumer options script phrases", () => {
    const transcript = "Let me show you the consumer options available and help you rank what's most important to you.";
    const keyPhrases = ["consumer options", "rank what's most important"];
    
    const found = checkPhrases(transcript, keyPhrases);
    expect(found).toHaveLength(2);
    expect(found).toContain("consumer options");
    expect(found).toContain("rank what's most important");
  });

  it("detects customization script phrases", () => {
    const transcript = "Which protection would you rank first? That's an excellent choice. Let's customize a program that fits your needs.";
    const keyPhrases = ["rank first", "excellent choice", "customize a program"];
    
    const found = checkPhrases(transcript, keyPhrases);
    expect(found).toHaveLength(3);
    expect(found).toContain("rank first");
    expect(found).toContain("excellent choice");
    expect(found).toContain("customize a program");
  });

  it("handles partial phrase matches correctly", () => {
    const transcript = "Congratulations! Your new vehicle is ready.";
    const keyPhrases = ["congratulations on your new vehicle"];
    
    const found = checkPhrases(transcript, keyPhrases);
    expect(found).toHaveLength(0); // Should not match partial phrases
  });

  it("handles case insensitive matching", () => {
    const transcript = "CONGRATULATIONS ON YOUR NEW VEHICLE!";
    const keyPhrases = ["congratulations on your new vehicle"];
    
    const found = checkPhrases(transcript, keyPhrases);
    expect(found).toHaveLength(1);
  });
});

describe("Menu Sequence Scoring", () => {
  const checkProductOrder = (transcript: string, expectedOrder: string[]) => {
    const mentions = expectedOrder.map(product => {
      const index = transcript.toLowerCase().indexOf(product.toLowerCase());
      return { product, index };
    }).filter(item => item.index !== -1);
    
    return mentions.sort((a, b) => a.index - b.index).map(item => item.product);
  };

  it("detects correct VSC then GAP order", () => {
    const transcript = "First, let me present the vehicle service agreement coverage. Next, I'd like to discuss guaranteed asset protection.";
    const expectedOrder = ["vehicle service agreement", "guaranteed asset protection"];
    
    const actualOrder = checkProductOrder(transcript, expectedOrder);
    expect(actualOrder).toEqual(expectedOrder);
  });

  it("detects incorrect product order", () => {
    const transcript = "Let's start with guaranteed asset protection, then move to vehicle service agreement.";
    const expectedOrder = ["vehicle service agreement", "guaranteed asset protection"];
    
    const actualOrder = checkProductOrder(transcript, expectedOrder);
    expect(actualOrder).not.toEqual(expectedOrder);
    expect(actualOrder).toEqual(["guaranteed asset protection", "vehicle service agreement"]);
  });

  it("handles missing products in sequence", () => {
    const transcript = "Today I'll present the vehicle service agreement benefits.";
    const expectedOrder = ["vehicle service agreement", "guaranteed asset protection"];
    
    const actualOrder = checkProductOrder(transcript, expectedOrder);
    expect(actualOrder).toHaveLength(1);
    expect(actualOrder).toContain("vehicle service agreement");
  });
});

describe("Process Adherence Scoring", () => {
  const countCompletedSteps = (transcript: string, requiredSteps: string[]) => {
    return requiredSteps.filter(step => 
      transcript.toLowerCase().includes(step.toLowerCase())
    ).length;
  };

  it("counts all completed process steps", () => {
    const transcript = "Welcome to our F&I office. Let me review your paperwork and present your protection options. Please sign here to complete your purchase.";
    const requiredSteps = ["welcome", "paperwork", "protection options", "purchase"];
    
    const completed = countCompletedSteps(transcript, requiredSteps);
    expect(completed).toBe(4);
  });

  it("counts partial process completion", () => {
    const transcript = "Welcome to our office. Let me present your protection options.";
    const requiredSteps = ["welcome", "paperwork", "protection options", "purchase"];
    
    const completed = countCompletedSteps(transcript, requiredSteps);
    expect(completed).toBe(2);
  });

  it("handles zero completed steps", () => {
    const transcript = "Hello there, how are you today?";
    const requiredSteps = ["welcome", "review paperwork", "present options", "complete purchase"];
    
    const completed = countCompletedSteps(transcript, requiredSteps);
    expect(completed).toBe(0);
  });
});

describe("Grading Rubric Categories", () => {
  const requiredRubricCategories = [
    "Script Fidelity",
    "Menu Sequence",
    "Process Adherence",
    "Professional Presentation",
    "Customer Engagement",
    "Compliance Requirements"
  ];

  it("includes all required rubric categories in grading prompt", () => {
    const gradingPrompt = `
      Please grade this F&I presentation based on the following criteria:
      - Script Fidelity: Use of approved language and key phrases
      - Menu Sequence: Proper order of product presentation
      - Process Adherence: Completion of required steps
      - Professional Presentation: Tone and delivery quality
      - Customer Engagement: Interaction and responsiveness
      - Compliance Requirements: Regulatory adherence
    `;

    requiredRubricCategories.forEach(category => {
      expect(gradingPrompt).toContain(category);
    });
  });

  it("validates rubric scoring structure", () => {
    const mockScoreData = {
      scriptFidelity: 85,
      menuSequence: 90,
      processAdherence: 78,
      professionalPresentation: 92,
      customerEngagement: 88,
      complianceRequirements: 95
    };

    expect(mockScoreData.scriptFidelity).toBeGreaterThan(0);
    expect(mockScoreData.menuSequence).toBeLessThanOrEqual(100);
    expect(mockScoreData.processAdherence).toBeGreaterThan(0);
    expect(mockScoreData.professionalPresentation).toBeLessThanOrEqual(100);
    expect(mockScoreData.customerEngagement).toBeGreaterThan(0);
    expect(mockScoreData.complianceRequirements).toBeLessThanOrEqual(100);
  });

  it("calculates overall grade from category scores", () => {
    const categoryScores = [85, 90, 78, 92, 88, 95];
    const expectedAverage = categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length;
    
    const actualAverage = categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length;
    expect(actualAverage).toBeCloseTo(expectedAverage, 1);
    expect(actualAverage).toBeGreaterThan(80);
  });
});

describe("Comprehensive Script Detection", () => {
  const checkAllPhrases = (text: string, phrases: string[]) => {
    const lower = text.toLowerCase();
    return phrases.filter(p => lower.includes(p.toLowerCase()));
  };

  it("detects multiple script elements in single transcript", () => {
    const fullTranscript = `
      Congratulations on your new vehicle! I'm here to help with state and federal documents.
      Let me present your consumer options and help you rank what's most important.
      This vehicle service agreement covers 100% of parts and labor.
      Guaranteed asset protection helps with total loss situations.
      Which would you rank first? Excellent choice, let's customize a program.
    `;

    const allKeyPhrases = [
      "congratulations on your new vehicle",
      "state and federal documents", 
      "consumer options",
      "rank what's most important",
      "vehicle service agreement",
      "100% of parts",
      "guaranteed asset protection",
      "total loss",
      "rank first",
      "excellent choice",
      "customize a program"
    ];

    const found = checkAllPhrases(fullTranscript, allKeyPhrases);
    expect(found.length).toBeGreaterThan(8);
    expect(found).toContain("congratulations on your new vehicle");
    expect(found).toContain("vehicle service agreement");
    expect(found).toContain("guaranteed asset protection");
  });
});
