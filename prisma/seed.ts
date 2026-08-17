import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // --- Categories ---
  const categoriesData = [
    { name: "All", icon: "🍽️", sortOrder: 0 },
    { name: "Wraps", icon: "🌯", sortOrder: 1 },
    { name: "Shawarma", icon: "🥙", sortOrder: 2 },
    { name: "Mandi", icon: "🍚", sortOrder: 3 },
    { name: "Madbi", icon: "🔥", sortOrder: 4 },
    { name: "Beverages", icon: "🥤", sortOrder: 5 },
    { name: "Sides", icon: "🍟", sortOrder: 6 },
    { name: "Desserts", icon: "🍰", sortOrder: 7 },
    { name: "Deals", icon: "🏷️", sortOrder: 8 },
  ];

  for (const c of categoriesData) {
    await db.category.upsert({
      where: { name: c.name },
      update: { icon: c.icon, sortOrder: c.sortOrder },
      create: c,
    });
  }
  console.log(`  Seeded ${categoriesData.length} categories`);

  // Build a name->id map for products
  const catMap: Record<string, number> = {};
  const allCats = await db.category.findMany();
  for (const c of allCats) catMap[c.name] = c.id;

  // --- Products + Addons ---
  const productsData = [
    {
      name: "Classic Chicken Wrap",
      description: "Juicy grilled chicken breast with fresh lettuce, tomatoes, onions, and our signature garlic mayo sauce wrapped in a warm Arabic pita bread.",
      price: 450,
      category: "Wraps",
      badge: "Bestseller",
      rating: 4.8,
      addons: [],
    },
    {
      name: "Spicy Shawarma Roll",
      description: "Tender marinated chicken cooked on a vertical spit, wrapped with pickled turnips, garlic sauce, and fresh herbs in a thin lavash bread.",
      price: 350,
      category: "Shawarma",
      badge: "Popular",
      rating: 4.6,
      addons: [
        { name: "Extra Garlic Sauce", price: 50 },
        { name: "Add Cheese", price: 80 },
      ],
    },
    {
      name: "Chicken Mandi",
      description: "Slow-cooked aromatic basmati rice with tender chicken, blended spices, and served with raita and special chutney.",
      price: 900,
      category: "Mandi",
      badge: "New",
      rating: 4.7,
      addons: [
        { name: "Extra Raita", price: 40 },
        { name: "Extra Chicken", price: 200 },
      ],
    },
    {
      name: "Lamb Madbi",
      description: "Traditional Arabian slow-roasted lamb on rice with a smoky charcoal flavor. Served with special sauce and fresh salad.",
      price: 1200,
      category: "Madbi",
      badge: "Premium",
      rating: 4.8,
      addons: [
        { name: "Extra Meat", price: 350 },
        { name: "Full Portion Upgrade", price: 400 },
      ],
    },
    {
      name: "Mango Lassi",
      description: "Refreshing traditional mango yogurt drink blended to creamy perfection with a hint of cardamom and rose water.",
      price: 200,
      category: "Beverages",
      badge: null,
      rating: 4.3,
      addons: [],
    },
    {
      name: "Loaded Fries",
      description: "Crispy golden fries topped with melted cheese sauce, jalapenos, and a drizzle of spicy mayo for the ultimate side dish.",
      price: 350,
      category: "Sides",
      badge: null,
      rating: 4.2,
      addons: [
        { name: "Extra Cheese", price: 60 },
        { name: "Add Chicken", price: 120 },
      ],
    },
    {
      name: "Lamb Mandi Special",
      description: "Premium lamb mandi slow-cooked for 6 hours with dried fruits, cashews, and almonds. Served with saffron rice and special sauce.",
      price: 1500,
      category: "Mandi",
      badge: "Premium",
      rating: 4.9,
      addons: [
        { name: "Extra Lamb", price: 400 },
        { name: "Full Meal Upgrade", price: 200 },
      ],
    },
    {
      name: "Family Deal",
      description: "2 Mandi + 4 Shawarma Rolls + 2 Drinks + Loaded Fries. Perfect for family gatherings and special occasions.",
      price: 3500,
      category: "Deals",
      badge: "Save 20%",
      rating: 4.8,
      addons: [],
    },
    {
      name: "Kunafa",
      description: "Traditional Arabic dessert made with crispy shredded pastry, layered with sweet cheese and soaked in sugar syrup.",
      price: 400,
      category: "Desserts",
      badge: null,
      rating: 4.6,
      addons: [],
    },
    {
      name: "Falafel Wrap",
      description: "Crispy herb-spiced falafel balls with hummus, pickled turnips, fresh vegetables, and tahini dressing in warm pita.",
      price: 400,
      category: "Wraps",
      badge: "Veg",
      rating: 4.5,
      addons: [
        { name: "Extra Falafel", price: 80 },
        { name: "Halloumi Cheese", price: 100 },
      ],
    },
    {
      name: "Beef Shawarma Plate",
      description: "Generous portions of seasoned beef shawarma served on a platter with rice, hummus, salad, garlic sauce, and pita bread.",
      price: 650,
      category: "Shawarma",
      badge: null,
      rating: 4.4,
      addons: [
        { name: "Extra Garlic Sauce", price: 50 },
        { name: "Add Fries", price: 100 },
      ],
    },
    {
      name: "Chicken Madbi",
      description: "Smoky charcoal-grilled chicken on aromatic rice with traditional Yemeni spices and a side of fresh salad and sauce.",
      price: 850,
      category: "Madbi",
      badge: null,
      rating: 4.5,
      addons: [
        { name: "Extra Chicken", price: 250 },
        { name: "Spicy Level Up", price: 30 },
      ],
    },
  ];

  for (const p of productsData) {
    const catId = catMap[p.category];
    if (!catId) {
      console.error(`  Category not found: ${p.category}`);
      continue;
    }

    const product = await db.product.upsert({
      where: { id: productsData.indexOf(p) + 1 },
      update: {
        name: p.name,
        description: p.description,
        price: p.price,
        categoryId: catId,
        badge: p.badge,
        rating: p.rating,
      },
      create: {
        name: p.name,
        description: p.description,
        price: p.price,
        categoryId: catId,
        badge: p.badge,
        rating: p.rating,
      },
    });

    // Seed addons
    for (const a of p.addons) {
      await db.productAddon.upsert({
        where: { productId_name: { productId: product.id, name: a.name } },
        update: { price: a.price },
        create: { name: a.name, price: a.price, productId: product.id },
      });
    }
  }
  console.log(`  Seeded ${productsData.length} products`);

  // --- Offers ---
  const offersData = [
    {
      title: "Free Delivery",
      description: "On orders above Rs. 1500",
      code: "FREEDEL",
      icon: "🚚",
      discountType: "free_delivery",
      discountValue: 0,
      minOrder: 1500,
    },
    {
      title: "20% Off Deals",
      description: "On all family deals this week",
      code: "FAMILY20",
      icon: "🎉",
      discountType: "percentage",
      discountValue: 20,
      minOrder: 0,
    },
    {
      title: "First Order",
      description: "Get 15% off your first order",
      code: "WELCOME15",
      icon: "🎁",
      discountType: "percentage",
      discountValue: 15,
      minOrder: 0,
    },
  ];

  for (const o of offersData) {
    await db.offer.upsert({
      where: { code: o.code },
      update: {
        title: o.title,
        description: o.description,
        icon: o.icon,
        discountType: o.discountType,
        discountValue: o.discountValue,
        minOrder: o.minOrder,
        isActive: true,
      },
      create: {
        ...o,
        validUntil: new Date("2027-12-31T23:59:59Z"),
      },
    });
  }
  console.log(`  Seeded ${offersData.length} offers`);

  // --- Demo Admin User (password: admin123) ---
  // bcrypt hash for 'admin123'
  const adminHash = "$2b$10$mfxYhazZ4e57i09ouSe5HOZpwc6Si7N9rK92k2qp3dB4N.Qk.kI8i";
  await db.user.upsert({
    where: { email: "admin@wraplab.pk" },
    update: {},
    create: {
      name: "Wrap Lab Admin",
      email: "admin@wraplab.pk",
      phone: "03127777067",
      passwordHash: adminHash,
      role: "admin",
    },
  });
  console.log("  Seeded admin user");

  console.log("\nSeed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
