import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // ── Platform config (singleton) ──
  await prisma.platformConfig.upsert({
    where: { id: 'platform' },
    update: {},
    create: { id: 'platform' },
  })

  // ── Plans ──
  const planDefs = [
    {
      name: 'Starter', nameAr: 'ستارتر', slug: 'starter',
      description: 'Perfect for new showrooms', descriptionAr: 'مثالي للمعارض الجديدة',
      priceMonthly: 199, priceYearly: 1910,
      maxCars: 15, sortOrder: 0, isFeatured: false,
      features: { market: false, auctions: false, api: false, reports: 'basic', support: 'email', customShowroom: true, teamMembers: 2 },
    },
    {
      name: 'Growth', nameAr: 'نمو', slug: 'growth',
      description: 'For growing showrooms', descriptionAr: 'للمعارض في مرحلة النمو',
      priceMonthly: 499, priceYearly: 4790,
      maxCars: 50, sortOrder: 1, isFeatured: true,
      features: { market: true, auctions: false, api: false, reports: 'advanced', support: 'chat', customShowroom: true, teamMembers: 5 },
    },
    {
      name: 'Pro', nameAr: 'برو', slug: 'pro',
      description: 'Full-featured for established showrooms', descriptionAr: 'كامل المميزات للمعارض المتقدمة',
      priceMonthly: 999, priceYearly: 9590,
      maxCars: null, sortOrder: 2, isFeatured: false,
      features: { market: true, auctions: true, api: true, reports: 'full', support: 'priority', customShowroom: true, teamMembers: null },
    },
    {
      name: 'Enterprise', nameAr: 'إنتربرايز', slug: 'enterprise',
      description: 'Custom pricing for large fleets', descriptionAr: 'تسعير مخصص للأسطول الكبير',
      priceMonthly: 0, priceYearly: 0,
      maxCars: null, sortOrder: 3, isFeatured: false, isPublic: false,
      features: { market: true, auctions: true, api: true, reports: 'full', support: 'dedicated', customShowroom: true, teamMembers: null },
    },
  ] as const

  const planMap: Record<string, string> = {}
  for (const p of planDefs) {
    const plan = await prisma.plan.upsert({
      where: { slug: p.slug },
      update: { priceMonthly: p.priceMonthly, priceYearly: p.priceYearly, isFeatured: p.isFeatured, features: p.features as object },
      create: {
        name: p.name, nameAr: p.nameAr, slug: p.slug,
        description: p.description, descriptionAr: p.descriptionAr,
        priceMonthly: p.priceMonthly, priceYearly: p.priceYearly,
        maxCars: p.maxCars ?? null,
        sortOrder: p.sortOrder, isFeatured: p.isFeatured,
        isPublic: (p as { isPublic?: boolean }).isPublic ?? true,
        features: p.features as object,
        trialDays: 14,
      },
    })
    planMap[p.slug] = plan.id
    console.log(`  Plan: ${p.nameAr} (${p.slug})`)
  }

  // ── Showroom (tenant) ──
  const showroom = await prisma.showroom.upsert({
    where: { slug: 'al-fahad' },
    update: {},
    create: {
      slug: 'al-fahad',
      name: 'معرض الفهد للسيارات',
      ownerName: 'فهد العتيبي',
      showroomNumber: 1001,
      city: 'الرياض',
      tagline: 'أفضل السيارات بأفضل الأسعار',
      whatsapp: '0501234567',
      phone: '0112345678',
      showPrices: true,
      profitMarginApproved: true,
      marketplaceEnabled: true,
      commissionPct: 2.5,
    },
  })

  // ── Subscription for demo showroom ──
  const growthPlanId = planMap['growth']
  if (growthPlanId) {
    await prisma.subscription.upsert({
      where: { showroomId: showroom.id },
      update: {},
      create: {
        showroomId: showroom.id,
        planId: growthPlanId,
        status: 'ACTIVE',
        billingPeriod: 'MONTHLY',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    })
    console.log('  Demo subscription: Growth plan (ACTIVE)')
  }

  // ── Owner user ──
  const password = await bcrypt.hash('password123', 12)
  const user = await prisma.showroomUser.upsert({
    where: { email: 'demo@carsell.one' },
    update: {},
    create: {
      showroomId: showroom.id,
      name: 'فهد العتيبي',
      email: 'demo@carsell.one',
      password,
      phone: '0501234567',
      role: 'SHOWROOM_OWNER',
      accountType: 'SHOWROOM',
      isActive: true,
      completedSteps: ['personalInfo', 'identity', 'showroomInfo'],
      nationalId: '1012345678',
      idType: 'CITIZEN',
      nafathVerified: true,
      nafathVerifiedAt: new Date(),
      kycStatus: 'APPROVED',
      city: 'الرياض',
    },
  })

  // ── Catalog: brands → categories → models ──
  const catalog: { ar: string; en: string; cats: { ar: string; en: string; body: 'SUV' | 'SEDAN' | 'PICKUP'; models: string[] }[] }[] = [
    {
      ar: 'تويوتا', en: 'Toyota',
      cats: [
        { ar: 'لاند كروزر', en: 'Land Cruiser', body: 'SUV', models: ['VXR', 'GXR', 'Twin Turbo'] },
        { ar: 'كامري', en: 'Camry', body: 'SEDAN', models: ['GLE', 'GLX', 'Hybrid'] },
        { ar: 'هايلكس', en: 'Hilux', body: 'PICKUP', models: ['GLX', 'Adventure'] },
      ],
    },
    {
      ar: 'لكزس', en: 'Lexus',
      cats: [
        { ar: 'LX 600', en: 'LX 600', body: 'SUV', models: ['Premium', 'VIP'] },
        { ar: 'ES 350', en: 'ES 350', body: 'SEDAN', models: ['Standard', 'F-Sport'] },
      ],
    },
    {
      ar: 'نيسان', en: 'Nissan',
      cats: [
        { ar: 'باترول', en: 'Patrol', body: 'SUV', models: ['LE', 'SE', 'Platinum'] },
      ],
    },
  ]

  const createdModels: { brandId: string; categoryId: string; modelId: string; body: 'SUV' | 'SEDAN' | 'PICKUP' }[] = []

  for (const b of catalog) {
    const brand = await prisma.brand.upsert({
      where: { id: `seed-${b.en}` },
      update: {},
      create: { id: `seed-${b.en}`, nameAr: b.ar, nameEn: b.en },
    })
    for (const c of b.cats) {
      const category = await prisma.category.upsert({
        where: { id: `seed-${b.en}-${c.en}` },
        update: {},
        create: { id: `seed-${b.en}-${c.en}`, brandId: brand.id, nameAr: c.ar, nameEn: c.en, bodyType: c.body },
      })
      for (const m of c.models) {
        const model = await prisma.model.upsert({
          where: { id: `seed-${b.en}-${c.en}-${m}` },
          update: {},
          create: { id: `seed-${b.en}-${c.en}-${m}`, categoryId: category.id, name: m },
        })
        createdModels.push({ brandId: brand.id, categoryId: category.id, modelId: model.id, body: c.body })
      }
    }
  }

  // ── Cars ──
  const colors = ['أبيض لؤلؤي', 'أسود', 'رمادي', 'فضي', 'أزرق']
  const statuses = ['FOR_SALE', 'FOR_SALE', 'FOR_SALE', 'AUCTION', 'RESERVED', 'DRAFT', 'SOLD'] as const
  const fuels = ['PETROL', 'HYBRID', 'DIESEL'] as const
  const carTypes = ['NEW', 'USED', 'USED_QUALIFIED'] as const

  // clear previous seed cars for idempotency
  await prisma.carTimeline.deleteMany({ where: { car: { showroomId: showroom.id } } })
  await prisma.carImage.deleteMany({ where: { car: { showroomId: showroom.id } } })
  await prisma.car.deleteMany({ where: { showroomId: showroom.id } })

  for (let i = 0; i < 14; i++) {
    const pick = createdModels[i % createdModels.length]
    const purchase = 200000 + i * 9000
    const sell = purchase + 30000 + (i % 4) * 5000
    const status = statuses[i % statuses.length]
    const car = await prisma.car.create({
      data: {
        showroomId: showroom.id,
        brandId: pick.brandId,
        categoryId: pick.categoryId,
        modelId: pick.modelId,
        year: 2021 + (i % 5),
        carType: carTypes[i % carTypes.length],
        bodyType: pick.body,
        colorExt: colors[i % colors.length],
        colorInt: 'بيج',
        fuelType: fuels[i % fuels.length],
        transmission: 'AUTOMATIC',
        odometer: (i + 1) * 12000,
        vin: `JT${String(100000 + i * 777)}DEMO${i}`,
        status,
        displayMode: status === 'AUCTION' ? 'AUCTION' : 'FIXED_PRICE',
        purchasePrice: purchase,
        sellPrice: status === 'DRAFT' ? null : sell,
        extraCosts: 3000 + i * 200,
        plateNumber: `ر س ن ${1000 + i}`,
        plateType: 'PRIVATE',
        listedOnMarket: i % 2 === 0,
        marketPrice: i % 2 === 0 ? sell : null,
        dataSource: 'MANUAL',
        createdBy: user.id,
        ...(status === 'AUCTION'
          ? {
              auctionType: 'PUBLIC',
              auctionStartAt: new Date(),
              auctionEndsAt: new Date(Date.now() + (i + 1) * 3600_000),
              auctionOpeningPrice: sell - 20000,
            }
          : {}),
      },
    })

    await prisma.carTimeline.create({
      data: { carId: car.id, userId: user.id, eventType: 'CAR_CREATED', payload: { source: 'SEED' } },
    })
  }

  console.log('✓ Seed complete:')
  console.log('  Showroom:', showroom.name, `(slug: ${showroom.slug})`)
  console.log('  Login:    demo@carsell.one / password123')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
