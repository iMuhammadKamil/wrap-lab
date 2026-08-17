import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// bcrypt hash for 'admin123' (shared by all demo admin users)
const adminHash = "$2b$10$mfxYhazZ4e57i09ouSe5HOZpwc6Si7N9rK92k2qp3dB4N.Qk.kI8i";

interface TenantSeed {
  slug: string;
  data: {
    name: string;
    tagline?: string;
    primaryColor?: string;
    secondaryColor?: string;
    phone?: string;
    email?: string;
    address?: string;
    whatsapp?: string;
    deliveryFee?: number;
    freeDeliveryThreshold?: number;
    currency?: string;
  };
  categories: { name: string; icon: string; sortOrder: number }[];
  products: {
    name: string;
    description: string;
    price: number;
    category: string;
    badge: string | null;
    rating: number;
    addons: { name: string; price: number }[];
  }[];
  offers: {
    title: string;
    description: string;
    code: string;
    icon: string;
    discountType: string;
    discountValue: number;
    minOrder: number;
  }[];
  admin: { name: string; email: string; phone: string };
}

async function getOrCreateTenant(spec: TenantSeed) {
  return db.tenant.upsert({
    where: { slug: spec.slug },
    update: spec.data,
    create: { slug: spec.slug, ...spec.data },
  });
}

async function seedTenant(spec: TenantSeed) {
  console.log(`\n--- ${spec.data.name} (${spec.slug}) ---`);

  const tenant = await getOrCreateTenant(spec);
  console.log(`  Tenant ready: ${tenant.slug} (${tenant.id})`);

  // --- Categories ---
  for (const c of spec.categories) {
    await db.category.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: c.name } },
      update: { icon: c.icon, sortOrder: c.sortOrder },
      create: { tenantId: tenant.id, ...c },
    });
  }
  console.log(`  Seeded ${spec.categories.length} categories`);

  // Build a tenant-scoped name->id map for products
  const catMap: Record<string, number> = {};
  const allCats = await db.category.findMany({ where: { tenantId: tenant.id } });
  for (const c of allCats) catMap[c.name] = c.id;

  // --- Products + Addons ---
  for (const p of spec.products) {
    const catId = catMap[p.category];
    if (!catId) {
      console.error(`  Category not found for tenant ${spec.slug}: ${p.category}`);
      continue;
    }

    // Product has no tenant-unique natural key, so look it up by tenantId + name
    let product = await db.product.findFirst({
      where: { tenantId: tenant.id, name: p.name },
    });

    if (product) {
      product = await db.product.update({
        where: { id: product.id },
        data: {
          description: p.description,
          price: p.price,
          categoryId: catId,
          badge: p.badge,
          rating: p.rating,
        },
      });
    } else {
      product = await db.product.create({
        data: {
          tenantId: tenant.id,
          name: p.name,
          description: p.description,
          price: p.price,
          categoryId: catId,
          badge: p.badge,
          rating: p.rating,
        },
      });
    }

    for (const a of p.addons) {
      await db.productAddon.upsert({
        where: {
          tenantId_productId_name: { tenantId: tenant.id, productId: product.id, name: a.name },
        },
        update: { price: a.price },
        create: { tenantId: tenant.id, name: a.name, price: a.price, productId: product.id },
      });
    }
  }
  console.log(`  Seeded ${spec.products.length} products`);

  // --- Offers ---
  for (const o of spec.offers) {
    await db.offer.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: o.code } },
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
        tenantId: tenant.id,
        ...o,
        validUntil: new Date("2027-12-31T23:59:59Z"),
      },
    });
  }
  console.log(`  Seeded ${spec.offers.length} offers`);

  // --- Admin user (password: admin123) ---
  await db.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: spec.admin.email } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: spec.admin.name,
      email: spec.admin.email,
      phone: spec.admin.phone,
      passwordHash: adminHash,
      role: "admin",
    },
  });
  console.log(`  Seeded admin user (${spec.admin.email})`);

  // --- Counts per tenant ---
  const [cats, prods, offers, users] = await Promise.all([
    db.category.count({ where: { tenantId: tenant.id } }),
    db.product.count({ where: { tenantId: tenant.id } }),
    db.offer.count({ where: { tenantId: tenant.id } }),
    db.user.count({ where: { tenantId: tenant.id } }),
  ]);
  console.log(`  => ${spec.slug}: ${cats} categories, ${prods} products, ${offers} offers, ${users} users`);

  return { slug: spec.slug, cats, prods, offers, users };
}

const tenants: TenantSeed[] = [
  {
    slug: "wraplab",
    data: {
      name: "Wrap Lab",
      phone: "03155008056",
      email: "wraplab.pk@gmail.com",
      address: "Ground Floor, Pakland Vista, I-8 Markaz, Islamabad",
      whatsapp: "03155008056",
      deliveryFee: 150,
      freeDeliveryThreshold: 1500,
      currency: "Rs.",
    },
    categories: [
      { name: "All", icon: "🍽️", sortOrder: 0 },
      { name: "Wraps", icon: "🌯", sortOrder: 1 },
      { name: "Shawarma", icon: "🥙", sortOrder: 2 },
      { name: "Mandi", icon: "🍚", sortOrder: 3 },
      { name: "Madbi", icon: "🔥", sortOrder: 4 },
      { name: "Beverages", icon: "🥤", sortOrder: 5 },
      { name: "Sides", icon: "🍟", sortOrder: 6 },
      { name: "Desserts", icon: "🍰", sortOrder: 7 },
      { name: "Deals", icon: "🏷️", sortOrder: 8 },
    ],
    products: [
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
    ],
    offers: [
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
    ],
    admin: {
      name: "Wrap Lab Admin",
      email: "admin@wraplab.pk",
      phone: "03127777067",
    },
  },
  {
    slug: "shawarma-palace",
    data: {
      name: "Shawarma Palace",
      tagline: "Best Shawarma in Town",
      phone: "03001234567",
      email: "hello@shawarmapalace.pk",
      deliveryFee: 200,
      freeDeliveryThreshold: 2000,
    },
    categories: [
      { name: "Shawarma", icon: "🥙", sortOrder: 0 },
      { name: "Wraps", icon: "🌯", sortOrder: 1 },
      { name: "Beverages", icon: "🥤", sortOrder: 2 },
    ],
    products: [
      {
        name: "Classic Shawarma",
        description: "Tender marinated chicken shawarma with garlic sauce, pickled turnips, and fresh veggies wrapped in warm pita bread.",
        price: 300,
        category: "Shawarma",
        badge: "Popular",
        rating: 4.7,
        addons: [],
      },
      {
        name: "Cheese Shawarma",
        description: "Classic chicken shawarma loaded with melted mozzarella cheese and our signature garlic sauce.",
        price: 380,
        category: "Shawarma",
        badge: null,
        rating: 4.5,
        addons: [],
      },
      {
        name: "Chicken Wrap",
        description: "Grilled chicken wrap with lettuce, tomatoes, onions, and creamy garlic mayo in Arabic pita.",
        price: 420,
        category: "Wraps",
        badge: null,
        rating: 4.4,
        addons: [],
      },
      {
        name: "Garlic Fries",
        description: "Crispy golden fries tossed in garlic butter with fresh herbs and a sprinkle of cheese.",
        price: 250,
        category: "Wraps",
        badge: null,
        rating: 4.3,
        addons: [],
      },
      {
        name: "Mint Lemonade",
        description: "Refreshing lemonade blended with fresh mint leaves and a touch of sweetness.",
        price: 150,
        category: "Beverages",
        badge: null,
        rating: 4.6,
        addons: [],
      },
    ],
    offers: [
      {
        title: "10% Off",
        description: "Get 10% off your order",
        code: "FIRST10",
        icon: "🎁",
        discountType: "percentage",
        discountValue: 10,
        minOrder: 0,
      },
      {
        title: "Free Delivery",
        description: "Free delivery on orders above Rs. 1000",
        code: "FREEDEL2",
        icon: "🚚",
        discountType: "free_delivery",
        discountValue: 0,
        minOrder: 1000,
      },
    ],
    admin: {
      name: "Shawarma Palace Admin",
      email: "admin@shawarmapalace.pk",
      phone: "03001234567",
    },
  },
];

async function main() {
  console.log("Seeding database...");

  for (const spec of tenants) {
    await seedTenant(spec);
  }

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