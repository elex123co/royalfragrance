// Every piece of wording the admin can edit from the dashboard. The `def`
// value is the original text and is what the site shows until it is edited.
// To make another piece of text editable, add it here and use t("key") where
// it appears.

export interface ContentField {
  key: string;
  group: string;
  section: string;
  label: string;
  def: string;
  multiline?: boolean;
  note?: string;
}

export const CONTENT_GROUPS = [
  "Home page",
  "Our Story page",
  "Future page",
  "Become a Vendor page",
  "Shop page",
  "Footer",
  "Vendor space",
] as const;

const F: ContentField[] = [];

function add(
  group: string,
  section: string,
  fields: [key: string, label: string, def: string, multiline?: boolean, note?: string][]
) {
  for (const [key, label, def, multiline, note] of fields) {
    F.push({ key, group, section, label, def, multiline, note });
  }
}

// ---------------------------------------------------------------- HOME
const H = "Home page";
add(H, "Top banner", [
  ["home.hero.badge", "Small label above the heading", "Royal Fragrance"],
  ["home.hero.title1", "Heading, first line", "Wear the Scent of"],
  ["home.hero.title2", "Heading, second line (shown in gold)", "Royalty."],
  [
    "home.hero.text",
    "Paragraph under the heading",
    "We currently curate exceptional fragrances for those who value distinction — while quietly building toward becoming an original perfume house with a signature scent identity of our own.",
    true,
  ],
  ["home.hero.btn1", "First button", "Shop Fragrances"],
  ["home.hero.btn2", "Second button", "Explore Our Story"],
]);
add(H, "Who we are", [
  ["home.intro.label", "Small label", "Who We Are"],
  ["home.intro.title", "Heading", "Fragrance, chosen with intention."],
  [
    "home.intro.p1",
    "First paragraph",
    "We're a fragrance brand built around discovery and distinction. We carefully hand-pick fragrances for their character; from the oud that lingers, to the musk that feels like skin, to the scent that becomes uniquely yours.",
    true,
  ],
  [
    "home.intro.p2",
    "Second paragraph",
    "But Royal Fragrance is more about finding a fragrance you love. Every order is an opportunity to earn your trust through quality, honest descriptions, transparent pricing, and a fragrance experience that lives up to its description. That's the standard we hold ourselves to today.",
    true,
  ],
]);
add(H, "Featured products", [
  ["home.featured.label", "Small label", "Best of the Collection"],
  ["home.featured.title", "Heading", "Featured Fragrances"],
  ["home.featured.btn", "Button under the products", "View All Products"],
]);
add(H, "Future of Royal Fragrance block", [
  ["home.future.label", "Small label", "The Future of Royal Fragrance"],
  ["home.future.title", "Heading", "The Future Smells Different."],
  [
    "home.future.text",
    "Paragraph",
    "We are not just building a store — we are building toward becoming an original fragrance house. Every product we curate today informs the scents we intend to create tomorrow.",
    true,
  ],
  ["home.future.pillar1", "Box 1", "Creating original fragrances"],
  ["home.future.pillar2", "Box 2", "Developing signature scents"],
  ["home.future.pillar3", "Box 3", "Experimenting with fragrance concepts"],
  ["home.future.pillar4", "Box 4", "Building a recognizable perfume identity"],
  ["home.future.btn", "Button", "Discover Our Vision"],
]);
add(H, "Why Royal Fragrance", [
  ["home.why.label", "Small label", "Why Royal Fragrance"],
  ["home.why.title", "Heading", "Built on Trust and Craft"],
  ["home.why.1.title", "Card 1 title", "Carefully Selected Fragrances"],
  ["home.why.1.text", "Card 1 text", "Every fragrance is chosen for character, quality, and lasting impression.", true],
  ["home.why.2.title", "Card 2 title", "Premium Customer Experience"],
  ["home.why.2.text", "Card 2 text", "From browsing to unboxing, every touchpoint is crafted to feel elevated.", true],
  ["home.why.3.title", "Card 3 title", "Secure Ordering"],
  ["home.why.3.text", "Card 3 text", "Payments are processed securely with verified, server-side confirmation.", true],
  ["home.why.4.title", "Card 4 title", "Reliable Delivery"],
  ["home.why.4.text", "Card 4 text", "Transparent delivery pricing and dependable fulfillment, every time.", true],
  ["home.why.5.title", "Card 5 title", "Growing Fragrance Innovation"],
  ["home.why.5.text", "Card 5 text", "We're building toward original, signature fragrances made by us.", true],
]);
add(H, "Become a vendor block", [
  ["home.vendor.label", "Small label", "Sales Partners"],
  ["home.vendor.title", "Heading", "Become a Royal Fragrance Vendor"],
  [
    "home.vendor.text",
    "Paragraph",
    "Qualified vendors and sales partners can sell Royal Fragrance products with their own personal dashboard — built to feel like a modern financial and sales workspace.",
    true,
  ],
  ["home.vendor.btn", "Button", "Become a Vendor"],
  ["home.vendor.perk1", "Box 1", "Dedicated collection account"],
  ["home.vendor.perk2", "Box 2", "Monitor incoming payments"],
  ["home.vendor.perk3", "Box 3", "Manage assigned inventory"],
  ["home.vendor.perk4", "Box 4", "Track deliveries to customers"],
]);
add(H, "Newsletter", [
  ["home.news.title", "Heading", "Stay Ahead of the Fragrance"],
  ["home.news.text", "Paragraph", "New fragrances, launches, and future releases — straight to your inbox.", true],
  ["home.news.placeholder", "Email box hint", "Your email address"],
  ["home.news.btn", "Button", "Subscribe"],
  ["home.news.success", "Message after subscribing", "You're on the list."],
  ["home.news.error", "Message when it fails", "Something went wrong. Please try again."],
]);

// ---------------------------------------------------------------- ABOUT
const A = "Our Story page";
add(A, "Search engines", [
  ["about.meta.title", "Page title (browser tab and Google)", "Our Story"],
  [
    "about.meta.desc",
    "Short description shown on Google",
    "Royal Fragrance began with a belief that a scent should feel like a signature. Discover who we are, what we curate today, and the fragrance house we're building for tomorrow.",
    true,
  ],
]);
add(A, "Top banner", [
  ["about.hero.label", "Small label", "Our Story"],
  ["about.hero.title", "Heading", "Fragrance, Chosen With Intention"],
  [
    "about.hero.text",
    "Paragraph",
    "Royal Fragrance began with a simple belief: a scent should feel like a signature, not an accessory.",
    true,
  ],
]);
add(A, "Who we are", [
  ["about.who.label", "Small label", "Who We Are"],
  ["about.who.title", "Heading", "More Than a Perfume Store"],
  [
    "about.who.p1",
    "First paragraph",
    "We're a fragrance brand built around discovery. Rather than filling shelves with whatever sells fastest, we hand-select fragrances for their character — the oud that lingers all day, the musk that feels like skin, the scent that becomes someone's signature.",
    true,
  ],
  [
    "about.who.p2",
    "Second paragraph",
    "Every order is a chance to earn trust: fast, transparent checkout, honest delivery pricing, and a fragrance that lives up to its description. That's the standard we hold every product to, today.",
    true,
  ],
]);
add(A, "Why fragrance matters", [
  ["about.matters.label", "Small label", "Why Fragrance Matters"],
  ["about.matters.title", "Heading", "Scent Is Memory"],
  [
    "about.matters.text",
    "Paragraph",
    "Long after an outfit is forgotten, a fragrance lingers in memory — in a room someone just left, a hug that lasted a second too long, a first impression that outlasts the conversation. We take that seriously. It's why we obsess over what we choose to sell, and why we're building toward creating fragrances of our own.",
    true,
  ],
]);
add(A, "Our values", [
  ["about.values.label", "Small label", "What Guides Us"],
  ["about.values.title", "Heading", "Our Values"],
  ["about.values.1.title", "Value 1 title", "Curated, Not Mass-Produced"],
  ["about.values.1.text", "Value 1 text", "Every fragrance we carry is chosen for character and staying power — not just shelf appeal.", true],
  ["about.values.2.title", "Value 2 title", "Fragrance as Identity"],
  ["about.values.2.text", "Value 2 text", "We believe a scent should feel personal — worn quietly, remembered loudly.", true],
  ["about.values.3.title", "Value 3 title", "Trust, Built Order by Order"],
  ["about.values.3.text", "Value 3 text", "Secure payments, transparent pricing, and dependable delivery — every single time.", true],
]);
add(A, "Bottom banner", [
  ["about.cta.title", "Heading", "The Present Is Only the Beginning"],
  ["about.cta.text", "Paragraph", "Read about where we're headed next as a brand.", true],
  ["about.cta.btn1", "First button", "Discover Our Vision"],
  ["about.cta.btn2", "Second button", "Shop Fragrances"],
]);

// ---------------------------------------------------------------- FUTURE
const U = "Future page";
add(U, "Search engines", [
  ["future.meta.title", "Page title (browser tab and Google)", "The Future of Royal Fragrance"],
  [
    "future.meta.desc",
    "Short description shown on Google",
    "We're not just curating fragrances — we're building toward becoming an original perfume house with a signature scent identity of our own. Discover where Royal Fragrance is headed.",
    true,
  ],
]);
add(U, "Top banner", [
  ["future.hero.label", "Small label", "The Future of Royal Fragrance"],
  ["future.hero.title", "Heading", "The Future Smells Different."],
  [
    "future.hero.text",
    "Paragraph",
    "We didn't set out to just sell fragrances. We set out to build a fragrance house — and today's collection is only the first chapter.",
    true,
  ],
]);
add(U, "Why we started here", [
  ["future.why.label", "Small label", "Why We Started Here"],
  ["future.why.title", "Heading", "Curation Before Creation"],
  [
    "future.why.text",
    "Paragraph",
    "Every great fragrance house started by understanding what makes a scent unforgettable. That's what curating exceptional fragrances has taught us — what people respond to, what they wear again and again, and what they specifically ask us for more of. That knowledge is the foundation we're building an original perfume line on top of.",
    true,
  ],
]);
add(U, "The road ahead", [
  ["future.road.label", "Small label", "Where We're Headed"],
  ["future.road.title", "Heading", "The Road Ahead"],
  ["future.road.chapter", "Word before the chapter number", "Chapter"],
  ["future.road.1.title", "Chapter 1 title", "Developing Original Fragrances"],
  ["future.road.1.text", "Chapter 1 text", "Moving from curating others' work to formulating scents of our own — from concept to bottle.", true],
  ["future.road.2.title", "Chapter 2 title", "Signature Scent Collections"],
  ["future.road.2.text", "Chapter 2 text", "Building a line that's unmistakably Royal Fragrance — not a copy of what already exists.", true],
  ["future.road.3.title", "Chapter 3 title", "A Recognizable Identity"],
  ["future.road.3.text", "Chapter 3 text", "A brand you can identify by scent alone, the way perfume houses earn a following over decades.", true],
  ["future.road.4.title", "Chapter 4 title", "Beyond Retail"],
  ["future.road.4.text", "Chapter 4 text", "From reselling exceptional fragrances to producing them — becoming a fragrance house in our own right.", true],
]);
add(U, "Bottom banner", [
  ["future.join.label", "Small label", "Be Part of It"],
  ["future.join.title", "Heading", "Join Us From the Beginning"],
  [
    "future.join.text",
    "Paragraph",
    "Every fragrance you buy today shapes what we create tomorrow. Subscribe for updates, or become a vendor and grow alongside us.",
    true,
  ],
  ["future.join.btn1", "First button", "Shop the Collection"],
  ["future.join.btn2", "Second button", "Become a Vendor"],
]);

// ---------------------------------------------------------------- BECOME A VENDOR
const B = "Become a Vendor page";
add(B, "Search engines", [
  ["vendorpage.meta.title", "Page title (browser tab and Google)", "Become a Vendor"],
  [
    "vendorpage.meta.desc",
    "Short description shown on Google",
    "Sell Royal Fragrance products through your own network. Earn 12% commission, get a personal vendor dashboard, track sales, manage inventory, and grow with a premium fragrance brand.",
    true,
  ],
]);
add(B, "Top of the page", [
  ["vendorpage.label", "Small label", "Sales Partners"],
  ["vendorpage.title", "Heading", "Become a Royal Fragrance Vendor"],
  [
    "vendorpage.text",
    "Paragraph",
    "Sell Royal Fragrance products through your own network — online, on WhatsApp, or in person — and earn 12% commission on every sale, with a dashboard built for real sales work.",
    true,
  ],
]);
add(B, "Benefits", [
  ["vendorpage.perk1.title", "Benefit 1 title", "Earn 12% Commission"],
  ["vendorpage.perk1.text", "Benefit 1 text", "On every sale you record or every order through your personal link.", true],
  ["vendorpage.perk2.title", "Benefit 2 title", "Dedicated Collection Account"],
  ["vendorpage.perk2.text", "Benefit 2 text", "Where supported by our payment provider, receive a personal account for customer payments.", true],
  ["vendorpage.perk3.title", "Benefit 3 title", "Monitor Payments Live"],
  ["vendorpage.perk3.text", "Benefit 3 text", "Every confirmed payment appears in your dashboard automatically.", true],
  ["vendorpage.perk4.title", "Benefit 4 title", "Manage Inventory"],
  ["vendorpage.perk4.text", "Benefit 4 text", "Track products assigned to you and what you have on hand.", true],
  ["vendorpage.perk5.title", "Benefit 5 title", "Track Deliveries"],
  ["vendorpage.perk5.text", "Benefit 5 text", "Record when products have been delivered to your customers.", true],
]);
add(B, "Under the benefits", [
  [
    "vendorpage.review",
    "Note about approval",
    "Applications are reviewed by our team. Once approved, your status changes from Pending Approval to Active and full dashboard features unlock. Until then, your dashboard stays locked.",
    true,
  ],
  ["vendorpage.whatsapp", "WhatsApp button", "Have questions? Chat with our brand on WhatsApp"],
]);

// ---------------------------------------------------------------- SHOP
const S = "Shop page";
add(S, "Shop heading", [
  ["shop.label", "Small label", "The Collection"],
  ["shop.title", "Heading", "Shop All Fragrances"],
  ["shop.empty", "Message when no product matches", "No fragrances match your filters. Try adjusting your search."],
]);

// ---------------------------------------------------------------- FOOTER
const O = "Footer";
add(O, "Brand column", [
  [
    "footer.about",
    "Short description",
    "A luxury fragrance brand for today, and an original perfume house in the making. More than a scent — a growing vision.",
    true,
  ],
  ["footer.copyright", "Copyright line (the year is added automatically)", "Royal Fragrance. All rights reserved."],
]);
add(O, "Contact", [
  ["footer.contact.title", "Column title", "Contact"],
  ["footer.contact.phone", "Phone number", "0704 021 8594", false, "Used for the tap-to-call link too."],
  ["footer.contact.email", "Email address", "royalfragrancescent@gmail.com", false, "Used for the tap-to-email link too."],
  ["footer.contact.address", "Address", "Abesan Estate, Ipaja, Lagos"],
]);
add(O, "Shop column", [
  ["footer.shop.title", "Column title", "Shop"],
  ["footer.shop.1", "Link 1", "All Fragrances"],
  ["footer.shop.2", "Link 2", "New Arrivals"],
  ["footer.shop.3", "Link 3", "Best Sellers"],
  ["footer.shop.4", "Link 4", "Gift Sets"],
]);
add(O, "Brand column links", [
  ["footer.brand.title", "Column title", "Brand"],
  ["footer.brand.1", "Link 1", "Our Story"],
  ["footer.brand.2", "Link 2", "The Future of Royal Fragrance"],
  ["footer.brand.3", "Link 3", "Become a Vendor"],
]);
add(O, "Support column", [
  ["footer.support.title", "Column title", "Support"],
  ["footer.support.1", "Link 1", "My Account"],
  ["footer.support.2", "Link 2", "Track Order"],
  ["footer.support.3", "Link 3", "Privacy Policy"],
  ["footer.support.4", "Link 4", "Terms & Conditions"],
]);

// ---------------------------------------------------------------- VENDOR SPACE
const V = "Vendor space";
add(V, "Dashboard home", [
  ["vendor.home.welcome", "Welcome line (use {name} for the vendor's name)", "Welcome, {name}"],
  ["vendor.home.earnings.label", "Earnings card title", "My Earnings"],
  ["vendor.home.earnings.hint", "Earnings card explanation", "Your 12% commission on recorded sales. This is the money you have made.", true],
  ["vendor.home.goods.label", "Goods at hand card title", "Goods at Hand"],
  ["vendor.home.received.label", "Payments received card title", "Payments Received"],
  [
    "vendor.home.received.hint",
    "Payments received explanation",
    "All customer payments that landed in your collection account. This belongs to the company, not your earnings.",
    true,
  ],
  ["vendor.home.today.label", "Received today card title", "Received Today"],
  ["vendor.home.today.hint", "Received today explanation", "Customer payments received in your collection account today.", true],
  ["vendor.home.pending.label", "Pending sale records card title", "Pending Sale Records"],
  ["vendor.home.pending.hint", "Pending sale records explanation", "Payments waiting to be matched to the products sold.", true],
  ["vendor.home.deliver.label", "Goods to deliver card title", "Goods to Deliver"],
  [
    "vendor.home.deliver.hint",
    "Goods to deliver explanation",
    "Customers who have paid but have not yet received their perfume from you. Deliver it, then mark it as delivered.",
    true,
  ],
  ["vendor.home.record", "Link text in the unrecorded payments notice", "Record now"],
]);
add(V, "Affiliate dashboard", [
  ["vendor.aff.share", "Note under the numbers", "Share your link with customers. Every purchase made through it is credited to you.", true],
  ["vendor.aff.link", "Link text", "Get your link"],
]);
add(V, "My Link page", [
  ["vendor.link.title", "Heading", "My Link"],
  [
    "vendor.link.text.regular",
    "Explanation for normal vendors",
    "This is your one personal link. Share it with customers: it opens a shop showing only the products assigned to you, and every purchase made through it is credited to you.",
    true,
  ],
  [
    "vendor.link.text.affiliate",
    "Explanation for affiliate vendors",
    "This is your one personal link. Share it with customers: it opens the full Royal Fragrance shop, and every purchase made through it is credited to you. You can also copy a link for any single product below.",
    true,
  ],
]);
add(V, "Batch Delivery page", [
  ["vendor.batch.title", "Heading", "Batch Delivery"],
  [
    "vendor.batch.text",
    "Explanation",
    "Group customers from the same location so they share one delivery fee. Open a batch, and customers can join it at checkout. Mark it delivered when the run is done.",
    true,
  ],
  [
    "vendor.batch.nolocation",
    "Message when no location is assigned",
    "The admin has not assigned you a batch location yet. Once they do, you can open batches for it here.",
    true,
  ],
]);
add(V, "Collection Account page", [
  [
    "vendor.account.note",
    "Note under the account card",
    "This is a sales collection account for receiving customer payments — not a personal or standalone banking product.",
    true,
  ],
]);

export const CONTENT_FIELDS: ContentField[] = F;
export const CONTENT_DEFAULTS: Record<string, string> = Object.fromEntries(F.map((f) => [f.key, f.def]));
