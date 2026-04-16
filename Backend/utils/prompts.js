// utils/prompts.js
// All prompt templates extracted from the notebook, kept as template-literal helpers.

// ── Component format descriptors ─────────────────────────────────────────────

export const COMPARISON_TABLE_FORMAT = `
For COMPARISON queries (Nexon vs Safari, Harrier vs Safari, etc.):
{
  "text": "<brief natural summary of comparison>",
  "component": {
    "required": true,
    "name": "comparison_table",
    "content": {
      "columns": [
        { "key": "feature", "label": "Feature" },
        { "key": "car1",    "label": "<Car 1 Name>" },
        { "key": "car2",    "label": "<Car 2 Name>" }
      ],
      "rows": [
        { "feature": "<feature name>", "car1": "<value>", "car2": "<value>" }
      ]
    }
  },
  "follow_up": "<question guiding towards purchase>"
}`;

export const CAR_CARD_FORMAT = `
For SINGLE CAR info queries:
{
  "text": "<natural language summary>",
  "component": {
    "required": true,
    "name": "car_card",
    "content": {
      "model": "<exact car model name>"
    }
  },
  "follow_up": "<question guiding towards purchase>"
}`;

export const SPEC_TABLE_FORMAT = `
For SPECIFICATION queries (one car's specs):
{
  "text": "<natural language summary>",
  "component": {
    "required": true,
    "name": "spec_table",
    "content": {
      "columns": [
        { "key": "feature", "label": "Feature" },
        { "key": "value",   "label": "Details" }
      ],
      "rows": [
        { "feature": "<n>", "value": "<value>" }
      ]
    }
  },
  "follow_up": "<question guiding towards purchase>"
}`;

export const GENERAL_FORMAT = `
For GENERAL queries (no component needed):
{
  "text": "<natural language answer>",
  "component": {
    "required": false,
    "name": null,
    "content": null
  },
  "follow_up": "<question guiding towards purchase>"
}`;

export const SHOW_CALCULATION_FORMAT = `
FOR CALCULATION queries (e.g., EMI calculation):
{
  "text": "<brief natural language summary of calculation>",
  "component": {
    "required": true,
    "name": "show_calculation",
    "content": {
      "title": "<name of the calculation>",
      "inputs": [
        { "label": "<input name>", "value": "<input value>" }
      ],
      "steps": [
        { "step": "<calculation step description>", "result": "<intermediate result>" }
      ],
      "result": {
        "label": "<final output name>",
        "value": "<final value>"
      }
    }
  },
  "follow_up": "<question guiding towards purchase>"
}`;

// ── Few-shot examples ─────────────────────────────────────────────────────────

export const EXAMPLES = `
**EXAMPLES TO LEARN FROM:**

Example 1 - Comparison (English):
Q: "Compare Tata Nexon and Safari"
A: {"text": "Nexon is a compact SUV (₹7-14L, 5 seats) while Safari is a full-size SUV (₹15-25L, 7 seats).", "component": {"required": true, "name": "comparison_table", "content": {"columns": [{"key": "feature", "label": "Feature"}, {"key": "nexon", "label": "Tata Nexon"}, {"key": "safari", "label": "Tata Safari"}], "rows": [{"feature": "Seating", "nexon": "5", "safari": "6 or 7"}, {"feature": "Price", "nexon": "₹7-14L", "safari": "₹15-25L"}]}}, "follow_up": "Which matters more - compact size or third-row seating?"}

Example 2 - Comparison (Hinglish):
Q: "Harrier aur Safari mein kya fark hai bhai?"
A: {"text": "Harrier 5-seater hai aur Safari 6-7 seater — basically same engine, Safari mein ek extra row milti hai.", "component": {"required": true, "name": "comparison_table", "content": {"columns": [{"key": "feature", "label": "Feature"}, {"key": "harrier", "label": "Tata Harrier"}, {"key": "safari", "label": "Tata Safari"}], "rows": [{"feature": "Seating", "harrier": "5", "safari": "6-7"}, {"feature": "Price", "harrier": "₹14-25L", "safari": "₹14.6-26L"}, {"feature": "Boot Space", "harrier": "406L", "safari": "420L"}, {"feature": "3rd Row", "harrier": "Nahi", "safari": "Haan"}]}}, "follow_up": "Family kitni badi hai aapki? 5 log ya zyada?"}

Example 3 - Single car (English):
Q: "Tell me about Tata Nexon"
A: {"text": "Tata Nexon is a compact SUV for young professionals with ₹7-14L budget and 5-star safety.", "component": {"required": true, "name": "car_card", "content": {"model": "Tata Nexon"}}, "follow_up": "Would you like to explore variants or compare with competitors?"}

Example 4 - Single car (Hinglish):
Q: "Nexon dikhao, suna hai bahut acchi hai"
A: {"text": "Haan bilkul! Nexon India ki bestselling compact SUV hai — 208mm ground clearance, 5-star safety, aur 3 fuel options mein available hai.", "component": {"required": true, "name": "car_card", "content": {"model": "Tata Nexon"}}, "follow_up": "Petrol lena hai ya Diesel? Ya EV consider kar rahe ho?"}

Example 5 - Single car (Pure Hindi):
Q: "Punch ke baare mein batao"
A: {"text": "Tata Punch ek micro SUV hai jo city driving ke liye perfect hai — compact size, lekin SUV jaisi height aur ground clearance.", "component": {"required": true, "name": "car_card", "content": {"model": "Tata Punch"}}, "follow_up": "Pehli baar car le rahe hain? Punch bilkul sahi rahegi budget mein."}

Example 6 - General (Hinglish - vague/recommendation):
Q: "Yaar mere liye kaunsi car sahi rahegi, family of 4 hai, Mumbai mein rehta hoon"
A: {"text": "Mumbai traffic ke liye Nexon ya Punch dono acche options hain — compact hain toh parking easy, aur ground clearance bhi achi hai.", "component": {"required": false, "name": null, "content": null}, "follow_up": "Budget roughly kitna socha hai? 7-10 lakh ya usse zyada?"}

Example 7 - General (Hinglish - greeting):
Q: "Haan bhai, car leni hai"
A: {"text": "Arrey bilkul, sahi jagah aaye ho! Tata ki poori range available hai — hatchback se lekar premium SUV tak.", "component": {"required": false, "name": null, "content": null}, "follow_up": "Pehle bata, family kitni badi hai aur mostly city drive karte ho ya highway?"}
`;

export const CALCULATION_EXAMPLES = `
Example - EMI Calculation:
Q: "Nexon on-road ₹11.5L, 20% down payment, 60 months at 9.5%. What's the EMI?"
A: {"text": "Nexon Creative Diesel EMI breakdown at 9.5%:", "component": {"required": true, "name": "show_calculation", "content": {"title": "Nexon EMI Calculator", "inputs": [{"label": "On-road Price", "value": "₹11,50,000"}, {"label": "Down Payment (20%)", "value": "₹2,30,000"}, {"label": "Loan Amount", "value": "₹9,20,000"}, {"label": "Interest Rate", "value": "9.5%"}, {"label": "Tenure", "value": "60 months"}], "steps": [{"step": "Monthly Rate = 9.5%/12", "result": "0.7917%"}, {"step": "EMI Formula Calculation", "result": "₹19,500/mo"}], "result": {"label": "Monthly EMI", "value": "₹19,500"}}}, "follow_up": "Zero DP EMI ₹24,530 (6-month holiday). Add Gold AMC ₹35k?"}

Example - On-Road Cost:
Q: "Nexon Creative Diesel ex-showroom ₹10.7L Delhi on-road total?"
A: {"text": "Complete Delhi on-road calculation:", "component": {"required": true, "name": "show_calculation", "content": {"title": "Delhi On-Road Breakdown", "inputs": [{"label": "Ex-Showroom", "value": "₹10,70,390"}], "steps": [{"step": "RTO + Road Tax (3.3%)", "result": "₹1,04,000"}, {"step": "1st Year Insurance", "result": "₹39,600"}, {"step": "Transport + Handling", "result": "₹35,000"}, {"step": "FASTag + Misc", "result": "₹11,000"}], "result": {"label": "Total On-Road", "value": "₹11,60,000"}}}, "follow_up": "Accessories bundle (mats + dashcam) ₹20k discount?"}

Example - EMI Hinglish:
Q: "Bhai Nexon ka EMI nikalo, 20% dunga, 5 saal ke liye"
A: {"text": "Chal bhai, Nexon ka EMI calculate karte hain — 20% down pe kuch aisa hoga:", "component": {"required": true, "name": "show_calculation", "content": {"title": "Nexon EMI Breakdown", "inputs": [{"label": "On-road Price", "value": "₹11,50,000"}, {"label": "Down Payment (20%)", "value": "₹2,30,000"}, {"label": "Loan Amount", "value": "₹9,20,000"}, {"label": "Interest Rate", "value": "9.5%"}, {"label": "Tenure", "value": "60 months"}], "steps": [{"step": "Monthly Rate = 9.5%/12", "result": "0.7917%"}, {"step": "EMI Formula", "result": "₹19,500/mo"}], "result": {"label": "Monthly EMI", "value": "₹19,500"}}}, "follow_up": "Zero down payment bhi possible hai — pehle 6 mahine sirf ₹9,370/mo. Dekhein?"}
`;

// ── Component-type → format string map ───────────────────────────────────────

export function getComponentFormat(queryType) {
  switch (queryType) {
    case "comparison_table":  return COMPARISON_TABLE_FORMAT;
    case "car_card":          return CAR_CARD_FORMAT;
    case "spec_table":        return SPEC_TABLE_FORMAT;
    case "show_calculation":  return SHOW_CALCULATION_FORMAT;
    default:                  return GENERAL_FORMAT;
  }
}
