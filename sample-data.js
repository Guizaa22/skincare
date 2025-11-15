// Sample data for initial setup
// You can use this to populate your database with initial services

const sampleServices = [
  {
    name: "Classic European Facial",
    description: "A luxurious 60-minute facial that includes deep cleansing, exfoliation, steam, extractions, and a customized mask. Perfect for maintaining healthy, glowing skin.",
    shortDescription: "Deep cleansing facial with extractions and customized mask",
    category: "facial-treatments",
    duration: 60,
    price: 85,
    benefits: [
      "Deep pore cleansing",
      "Improved skin texture",
      "Increased hydration",
      "Relaxation and stress relief"
    ],
    skinTypes: ["normal", "oily", "combination"],
    targetConcerns: ["maintenance", "dryness"],
    isPopular: true,
    isFeatured: true,
    displayOrder: 1
  },
  {
    name: "Anti-Aging Microdermabrasion",
    description: "Advanced exfoliation treatment that removes dead skin cells and stimulates collagen production. Reduces fine lines, wrinkles, and age spots for a more youthful appearance.",
    shortDescription: "Advanced exfoliation to reduce signs of aging",
    category: "anti-aging",
    duration: 45,
    price: 120,
    benefits: [
      "Reduces fine lines",
      "Improves skin texture",
      "Minimizes age spots",
      "Stimulates collagen production"
    ],
    skinTypes: ["normal", "oily", "combination"],
    targetConcerns: ["aging", "pigmentation"],
    isPopular: true,
    displayOrder: 2
  },
  {
    name: "Acne Treatment Facial",
    description: "Specialized treatment for acne-prone skin featuring deep cleansing, antibacterial therapy, and healing masks. Helps clear existing breakouts and prevent future ones.",
    shortDescription: "Specialized treatment for acne-prone skin",
    category: "acne-treatments",
    duration: 75,
    price: 95,
    benefits: [
      "Clears existing breakouts",
      "Prevents future acne",
      "Reduces inflammation",
      "Balances oil production"
    ],
    skinTypes: ["oily", "combination"],
    targetConcerns: ["acne"],
    isPopular: true,
    displayOrder: 3
  },
  {
    name: "Hydrating Facial",
    description: "Intensive moisture therapy for dry and dehydrated skin. Includes hydrating serums, masks, and massage techniques to restore skin's natural moisture barrier.",
    shortDescription: "Intensive moisture therapy for dry skin",
    category: "facial-treatments",
    duration: 60,
    price: 90,
    benefits: [
      "Deep hydration",
      "Restored moisture barrier",
      "Plump, dewy skin",
      "Reduced fine lines"
    ],
    skinTypes: ["dry", "sensitive"],
    targetConcerns: ["dryness", "sensitivity"],
    displayOrder: 4
  },
  {
    name: "Chemical Peel - Light",
    description: "Gentle chemical exfoliation using alpha hydroxy acids to improve skin texture, reduce hyperpigmentation, and reveal fresher, younger-looking skin.",
    shortDescription: "Gentle chemical exfoliation for skin renewal",
    category: "chemical-peels",
    duration: 30,
    price: 75,
    benefits: [
      "Improved skin texture",
      "Reduced hyperpigmentation",
      "Smaller pore appearance",
      "Brighter complexion"
    ],
    skinTypes: ["normal", "oily", "combination"],
    targetConcerns: ["pigmentation", "aging"],
    displayOrder: 5
  },
  {
    name: "Sensitive Skin Facial",
    description: "Gentle, soothing treatment designed specifically for sensitive skin. Uses calming ingredients and techniques to reduce redness and irritation.",
    shortDescription: "Gentle, soothing treatment for sensitive skin",
    category: "facial-treatments",
    duration: 50,
    price: 80,
    benefits: [
      "Reduces redness",
      "Calms irritation",
      "Strengthens skin barrier",
      "Gentle cleansing"
    ],
    skinTypes: ["sensitive"],
    targetConcerns: ["sensitivity", "rosacea"],
    displayOrder: 6
  },
  {
    name: "Consultation",
    description: "Comprehensive skin analysis and consultation with our skincare expert. Includes personalized treatment recommendations and home care plan.",
    shortDescription: "Professional skin analysis and personalized recommendations",
    category: "consultation",
    duration: 30,
    price: 50,
    benefits: [
      "Professional skin analysis",
      "Personalized treatment plan",
      "Product recommendations",
      "Skincare education"
    ],
    skinTypes: ["normal", "oily", "dry", "combination", "sensitive"],
    targetConcerns: ["acne", "aging", "dryness", "sensitivity", "pigmentation", "rosacea"],
    isFeatured: true,
    displayOrder: 7
  }
];

module.exports = sampleServices;

// To use this data, you can create a script that inserts these services into your database:
/*
const mongoose = require('mongoose');
const Service = require('./models/Service');
const sampleServices = require('./sample-data');

async function populateServices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    await Service.deleteMany({}); // Clear existing services
    await Service.insertMany(sampleServices);
    console.log('Sample services inserted successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error inserting sample services:', error);
    process.exit(1);
  }
}

populateServices();
*/
