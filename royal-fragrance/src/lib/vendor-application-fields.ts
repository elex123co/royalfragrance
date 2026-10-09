// Single source of truth for the vendor application questions. These copy
// the brand's Google Form exactly (wording, order, required flags) and are
// shared by the form, the server action, and the admin review page.

export const APPLICATION_TITLE = "ROYAL FRAGRANCE";
export const APPLICATION_INTRO = [
  "Thank you for your interest in becoming a Royal Fragrance sales representative.",
  "Please fill out this form with your correct information. This opportunity allows you to earn while promoting luxury fragrances in school.",
];

export interface QuestionDef {
  key: string;
  label: string;
  required: boolean;
  type?: "text" | "email" | "tel";
}

// Email is taken separately (pre-filled from the verified invite link).
export const MAIN_QUESTIONS: QuestionDef[] = [
  { key: "fullName", label: "FULL NAME", required: true },
  { key: "university", label: "UNIVERSITY", required: true },
  { key: "level", label: "LEVEL", required: true },
  { key: "phone", label: "PHONE NUMBER", required: true, type: "tel" },
  { key: "department", label: "DEPARTMENT", required: true },
  { key: "hostel", label: "HOSTEL", required: true },
  { key: "stateOfOrigin", label: "STATE OF ORIGIN", required: true },
  { key: "stateOfResidence", label: "STATE OF RESIDENCE", required: true },
  { key: "previousSalesExperience", label: "PREVIOUS SALES EXPERIENCE", required: true },
  { key: "passionForSelling", label: "DO YOU HAVE A PASSION FOR SELLING?", required: true },
  { key: "regularSalesReport", label: "CAN YOU SUBMIT A SALES REPORT REGULARLY?", required: true },
  { key: "socialActivity", label: "HOW ACTIVE ARE YOU ON WHATSAPP AND OTHER SOCIAL MEDIA?", required: true },
  { key: "comfortablePayingCompany", label: "ARE YOU COMFORTABLE WITH CUSTOMERS PAYING DIRECTLY INTO THE COMPANY'S ACCOUNT?", required: true },
  { key: "usesPerfumes", label: "DO YOU CURRENTLY USE PERFUMES REGULARLY ? IF YES WHICH ONES?", required: true },
  { key: "representHonestly", label: "DO YOU WISH TO REPRESENT ROYAL FRAGRANCE PROFESSIONALLY AND HONESTLY?", required: true },
  { key: "followsInstructions", label: "HOW ACCOUNTABLE AND EFFICIENT ARE YOU TO FOLLOWING INSTRUCTIONS?", required: true },
];

export const REFERENCE_HEADING = "REFERENCE DETAILS";
export const REFERENCE_DESCRIPTION =
  "PLEASE PROVIDE ONE OR TWO PEOPLE WHO CAN VOUCH FOR YOUR CREDIBILITY AND ACCOUNTABILITY.";
export const REFERENCE_QUESTIONS: QuestionDef[] = [
  { key: "refName", label: "FULL NAME", required: true },
  { key: "refPhone", label: "PHONE NUMBER/ NUMBERS", required: true },
  { key: "refRelationship", label: "RELATIONSHIP", required: true },
];

export const STUDENT_STATUS_LABEL = "STUDENT OR NOT";
export const STUDENT_STATUS_OPTIONS = ["STUDENT", "Other"] as const;
export const STUDENT_FOLLOWUPS: QuestionDef[] = [
  { key: "studentLevel", label: "IF STUDENT WHAT LEVEL?", required: false },
  { key: "studentDepartment", label: "DEPARTMENT", required: false },
  { key: "studentHostel", label: "HOSTEL", required: false },
];

// Labels used when showing a stored application to admins.
export const ANSWER_LABELS: Record<string, string> = {
  ...Object.fromEntries(MAIN_QUESTIONS.map((q) => [q.key, q.label])),
  refName: "REFERENCE: FULL NAME",
  refPhone: "REFERENCE: PHONE NUMBER/ NUMBERS",
  refRelationship: "REFERENCE: RELATIONSHIP",
  studentStatus: STUDENT_STATUS_LABEL,
  studentOther: "STUDENT OR NOT (Other)",
  studentLevel: "IF STUDENT WHAT LEVEL?",
  studentDepartment: "DEPARTMENT (student section)",
  studentHostel: "HOSTEL (student section)",
};
