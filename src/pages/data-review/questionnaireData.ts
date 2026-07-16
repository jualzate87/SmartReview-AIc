/**
 * Seeded Jessica Drake Tax Organizer / Questionnaire responses.
 * Diagnostics cite these via responseId + View client response CTAs.
 */
export type QuestionnaireResponseId =
  | 'mortgage'
  | 'estimatedPayments'
  | 'necExpenses'
  | 'workplacePlan'

export type QuestionnaireResponse = {
  id: QuestionnaireResponseId
  topic: string
  question: string
  answer: string
  date: string
  clientName: string
}

export const QUESTIONNAIRE_RESPONSES: QuestionnaireResponse[] = [
  {
    id: 'mortgage',
    topic: 'Home / mortgage',
    question:
      'Do you own a home and pay mortgage interest? If you received Form 1098, please upload it or confirm the interest amount.',
    answer:
      'Yes. I own my home and paid mortgage interest in 2025. I think I got a Form 1098 from my lender but I haven’t uploaded it yet. Interest was somewhere around the mid five figures; I can dig up the form if you need the exact amount.',
    date: 'Feb 28, 2025',
    clientName: 'Jessica Drake',
  },
  {
    id: 'estimatedPayments',
    topic: 'Estimated tax payments',
    question:
      'Did you make any quarterly Form 1040-ES estimated tax payments for 2025?',
    answer:
      'No. I didn’t make any estimated payments this year. I figured my W-2 and 1099 withholding would cover everything like usual.',
    date: 'Mar 2, 2025',
    clientName: 'Jessica Drake',
  },
  {
    id: 'necExpenses',
    topic: '1099-NEC / business expenses',
    question:
      'For your Summit Advisory Partners contracting work (1099-NEC), did you have business expenses we should claim on Schedule C?',
    answer:
      'Yes. I had expenses for software, home office supplies, and some travel for that consulting work. I don’t have a clean receipt packet yet and I’m not sure what’s deductible. Nothing for expenses is on the return yet.',
    date: 'Mar 5, 2025',
    clientName: 'Jessica Drake',
  },
  {
    id: 'workplacePlan',
    topic: 'Workplace retirement plan',
    question:
      'Were you covered by a workplace retirement plan in 2025 (for example, a 401(k) at Tech Circle)?',
    answer:
      'Yes. Tech Circle has a 401(k) and I contribute. Box 13 on my W-2 should show retirement plan coverage.',
    date: 'Mar 5, 2025',
    clientName: 'Jessica Drake',
  },
]

export const QUESTIONNAIRE_DOC_KEY = 'questionnaire'
