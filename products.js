/* =====================================================================
   OFFSEASON — STARTING DATA
   This file holds the demo content the shop starts with (and what
   "Reset to demo" in the admin restores). You no longer need to edit it:
   open  admin.html  and change everything with buttons and forms.
   ===================================================================== */

window.OS_DEFAULTS = {

  store: {
    name: "OFFSEASON",
    tagline: "Authentic brands, off the calendar.",

    currency: "€",

    orderEmail: "you@example.com",   // where orders are sent
    contactEmail: "",                // public email shown in the footer (optional)
    phone: "",
    address: "",
    hours: "",
    whatsapp: "",                    // country code + number, digits only

    instagram: "offseason",
    tiktok: "",
    facebook: "",
    youtube: "",

    shippingFee: 4,
    freeShippingOver: 100,
    payments: ["Cash on delivery", "Bank transfer"],

    heroImage: "",
    instagramImages: [
      "images/ig-1.jpg", "images/ig-2.jpg", "images/ig-3.jpg",
      "images/ig-4.jpg", "images/ig-5.jpg", "images/ig-6.jpg"
    ]
  },

  // Texts on the homepage. {name} = store name, {freeOver} = free-delivery amount,
  // {n} = pieces in stock, {year} = current year.
  content: {
    heroLabel: "Season: none",
    heroCount: "{n} pieces in stock",
    button1: "Shop all",
    button2: "New in",
    marquee: [
      "Authentic branded pieces",
      "Limited sizes",
      "Free delivery over {freeOver}",
      "When it's gone it's gone"
    ],
    newInTitle: "New in",
    newInLink: "View all →",
    categoriesTitle: "Categories",
    statement: "Authentic labels. Limited sizes. When it's gone, it's gone.",
    statementSmall: "{name} — no restocks on most pieces",
    infoDelivery: "Dispatched within 2–3 working days.",
    infoPayment: "We confirm every order by message before anything ships.",
    infoReturns: "Unworn items with tags can be returned within 14 days. Message us first."
  },

  theme: {
    bone: "#E8E5DE",     // page background
    paper: "#F2F0EB",    // panels
    ink: "#0E0E0D",      // text and dark areas
    stone: "#7D796F",    // muted text
    line: "#C9C5BB",     // thin lines
    headFont: "Big Shoulders Display",
    bodyFont: "Archivo",
    radius: 0,           // corner roundness in px (0 = sharp)
    grain: true          // subtle film-grain texture
  },

  categories: ["Outerwear", "Tops", "Bottoms", "Footwear", "Accessories"],

  // DEMO ITEMS with made-up brands.
  products: [
    {
      id: "001", brand: "NORTHLINE", name: "Boxy Work Jacket", category: "Outerwear",
      price: 189, new: true, images: [],
      description: "Cotton canvas chore jacket with a boxy cut, four patch pockets and a corduroy collar. Heavy and structured, made to be worn hard.",
      sizes: { "S": 2, "M": 4, "L": 3, "XL": 0 }
    },
    {
      id: "002", brand: "KILN", name: "Heavyweight Hoodie", category: "Tops",
      price: 96, new: true, images: [],
      description: "450gsm brushed-back fleece with a dropped shoulder and a double-layer hood. Garment washed for a worn-in finish.",
      sizes: { "S": 0, "M": 3, "L": 5, "XL": 2 }
    },
    {
      id: "003", brand: "ATELIER 9", name: "Washed Pocket Tee", category: "Tops",
      price: 42, images: [],
      description: "Mid-weight cotton jersey, sun-faded wash, relaxed fit with a single chest pocket.",
      sizes: { "S": 6, "M": 8, "L": 4, "XL": 1 }
    },
    {
      id: "004", brand: "NORTHLINE", name: "Pleated Cargo Pant", category: "Bottoms",
      price: 124, new: true, images: [],
      description: "Wide-leg cargo with double front pleats, side bellows pockets and an adjustable hem.",
      sizes: { "30": 2, "32": 4, "34": 3, "36": 1 }
    },
    {
      id: "005", brand: "KILN", name: "Straight Raw Denim", category: "Bottoms",
      price: 108, oldPrice: 140, images: [],
      description: "14oz selvedge denim, straight through the leg. Unwashed, so it will fade to you.",
      sizes: { "30": 1, "32": 3, "34": 2, "36": 0 }
    },
    {
      id: "006", brand: "FAIRWAY", name: "Court Sneaker", category: "Footwear",
      price: 138, new: true, images: [],
      description: "Leather court silhouette on a cupsole, with a tonal stitched toe cap. Sizes are EU.",
      sizes: { "41": 2, "42": 3, "43": 3, "44": 1, "45": 0 }
    },
    {
      id: "007", brand: "ATELIER 9", name: "Nylon Crossbody", category: "Accessories",
      price: 58, images: [],
      description: "Water-resistant ripstop nylon, two zipped compartments and an adjustable strap.",
      sizes: { "One size": 7 }
    },
    {
      id: "008", brand: "FAIRWAY", name: "Rib Knit Beanie", category: "Accessories",
      price: 29, images: [],
      description: "Soft merino-blend rib knit with a deep fold. Sold out, kept here to show the sold-out state.",
      sizes: { "One size": 0 }
    }
  ]
};
