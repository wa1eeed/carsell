// CarSell database seed — plain ESM JavaScript (runs with `node prisma/seed.mjs`,
// no tsx/ts-node/compile needed; always present in the runtime image).
//
// Production (NODE_ENV=production): seeds ONLY plans + catalog (+ super admin
// if SUPER_ADMIN_EMAIL/PASSWORD set). Demo data is skipped.
// Local/dev: also seeds a demo showroom + cars (SEED_DEMO=true to force anywhere).

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const SEED_DEMO = process.env.SEED_DEMO === 'true' || process.env.NODE_ENV !== 'production'

async function main() {
  console.log(`Seeding (demo data: ${SEED_DEMO ? 'YES' : 'NO — production'})`)

  await prisma.platformConfig.upsert({
    where: { id: 'platform' }, update: {}, create: { id: 'platform' },
  })

  // ── Plans ──
  const planDefs = [
    { name: 'Starter', nameAr: 'ستارتر', slug: 'starter',
      description: 'Perfect for new showrooms', descriptionAr: 'مثالي للمعارض الجديدة',
      priceMonthly: 199, priceYearly: 1910, maxCars: 15, sortOrder: 0, isFeatured: false,
      features: { market: false, auctions: false, api: false, reports: 'basic', support: 'email', customShowroom: true, teamMembers: 2 } },
    { name: 'Growth', nameAr: 'نمو', slug: 'growth',
      description: 'For growing showrooms', descriptionAr: 'للمعارض في مرحلة النمو',
      priceMonthly: 499, priceYearly: 4790, maxCars: 50, sortOrder: 1, isFeatured: true,
      features: { market: true, auctions: false, api: false, reports: 'advanced', support: 'chat', customShowroom: true, teamMembers: 5 } },
    { name: 'Pro', nameAr: 'برو', slug: 'pro',
      description: 'Full-featured for established showrooms', descriptionAr: 'كامل المميزات للمعارض المتقدمة',
      priceMonthly: 999, priceYearly: 9590, maxCars: null, sortOrder: 2, isFeatured: false,
      features: { market: true, auctions: true, api: true, reports: 'full', support: 'priority', customShowroom: true, teamMembers: null } },
    { name: 'Enterprise', nameAr: 'إنتربرايز', slug: 'enterprise',
      description: 'Custom pricing for large fleets', descriptionAr: 'تسعير مخصص للأسطول الكبير',
      priceMonthly: 0, priceYearly: 0, maxCars: null, sortOrder: 3, isFeatured: false, isPublic: false,
      features: { market: true, auctions: true, api: true, reports: 'full', support: 'dedicated', customShowroom: true, teamMembers: null } },
  ]

  const planMap = {}
  for (const p of planDefs) {
    const plan = await prisma.plan.upsert({
      where: { slug: p.slug },
      update: { priceMonthly: p.priceMonthly, priceYearly: p.priceYearly, isFeatured: p.isFeatured, features: p.features },
      create: {
        name: p.name, nameAr: p.nameAr, slug: p.slug,
        description: p.description, descriptionAr: p.descriptionAr,
        priceMonthly: p.priceMonthly, priceYearly: p.priceYearly,
        maxCars: p.maxCars ?? null, sortOrder: p.sortOrder, isFeatured: p.isFeatured,
        isPublic: p.isPublic ?? true, features: p.features, trialDays: 14,
      },
    })
    planMap[p.slug] = plan.id
    console.log(`  Plan: ${p.nameAr} (${p.slug})`)
  }

  // ── Super Admin (from env vars) ──
  const saEmail = process.env.SUPER_ADMIN_EMAIL
  const saPassword = process.env.SUPER_ADMIN_PASSWORD
  if (saEmail && saPassword) {
    const adminShowroom = await prisma.showroom.upsert({
      where: { slug: '__platform__' }, update: {},
      create: { slug: '__platform__', name: 'CarSell Platform', ownerName: 'Platform Admin' },
    })
    const hash = await bcrypt.hash(saPassword, 12)
    await prisma.showroomUser.upsert({
      where: { email: saEmail },
      update: { role: 'PLATFORM_ADMIN', password: hash, isActive: true },
      create: {
        showroomId: adminShowroom.id, name: 'Platform Admin', email: saEmail, password: hash,
        role: 'PLATFORM_ADMIN', accountType: 'COMPANY', isActive: true,
        completedSteps: ['personalInfo', 'identity', 'showroomInfo'], kycStatus: 'APPROVED',
      },
    })
    console.log(`  ✓ Super Admin: ${saEmail}`)
  } else {
    console.log('  (skip Super Admin — set SUPER_ADMIN_EMAIL + SUPER_ADMIN_PASSWORD)')
  }

  // ── Catalog (brands → categories → models) ──
  const catalog = [
    { ar: 'تويوتا', en: 'Toyota', cats: [
      { ar: 'لاند كروزر', en: 'Land Cruiser', body: 'SUV',
        fuels: ['PETROL'], trans: ['AUTOMATIC'],
        models: ['VXR', 'GXR', 'GR Sport', 'Twin Turbo', 'Standard'] },
      { ar: 'كامري', en: 'Camry', body: 'SEDAN',
        fuels: ['PETROL', 'HYBRID'], trans: ['AUTOMATIC'],
        models: ['GLE', 'GLX', 'SE', 'Hybrid'] },
      { ar: 'هايلكس', en: 'Hilux', body: 'PICKUP',
        fuels: ['DIESEL', 'PETROL'], trans: ['AUTOMATIC', 'MANUAL'],
        models: ['GLX', 'Adventure', 'SR5'] },
      { ar: 'راف 4', en: 'RAV4', body: 'SUV',
        fuels: ['PETROL', 'HYBRID'], trans: ['AUTOMATIC'],
        models: ['GLE', 'GLX', 'Adventure', 'Hybrid'] },
    ]},
    { ar: 'لكزس', en: 'Lexus', cats: [
      { ar: 'LX 600', en: 'LX 600', body: 'SUV',
        fuels: ['PETROL'], trans: ['AUTOMATIC'],
        models: ['Premium', 'VIP', 'F-Sport', 'Luxury'] },
      { ar: 'ES 350', en: 'ES 350', body: 'SEDAN',
        fuels: ['PETROL', 'HYBRID'], trans: ['AUTOMATIC'],
        models: ['Standard', 'F-Sport', 'Ultra Luxury'] },
      { ar: 'GX 460', en: 'GX 460', body: 'SUV',
        fuels: ['PETROL'], trans: ['AUTOMATIC'],
        models: ['Premium', 'Luxury', 'Sport'] },
    ]},
    { ar: 'نيسان', en: 'Nissan', cats: [
      { ar: 'باترول', en: 'Patrol', body: 'SUV',
        fuels: ['PETROL'], trans: ['AUTOMATIC'],
        models: ['LE', 'SE', 'Platinum', 'NISMO'] },
      { ar: 'التيما', en: 'Altima', body: 'SEDAN',
        fuels: ['PETROL'], trans: ['AUTOMATIC'],
        models: ['S', 'SV', 'SL', 'SR'] },
    ]},
    { ar: 'BMW', en: 'BMW', cats: [
      { ar: 'X5', en: 'X5', body: 'SUV',
        fuels: ['PETROL', 'DIESEL'], trans: ['AUTOMATIC'],
        models: ['sDrive30i', 'xDrive40i', 'M50i'] },
      { ar: 'الفئة السابعة', en: '7 Series', body: 'SEDAN',
        fuels: ['PETROL', 'HYBRID'], trans: ['AUTOMATIC'],
        models: ['730Li', '740Li', '750Li', '760i M'] },
      { ar: 'الفئة الثالثة', en: '3 Series', body: 'SEDAN',
        fuels: ['PETROL', 'DIESEL'], trans: ['AUTOMATIC', 'MANUAL'],
        models: ['320i', '330i', '340i', 'M340i'] },
    ]},
    { ar: 'مرسيدس بنز', en: 'Mercedes-Benz', cats: [
      { ar: 'S-Class', en: 'S-Class', body: 'SEDAN',
        fuels: ['PETROL', 'HYBRID'], trans: ['AUTOMATIC'],
        models: ['S 450', 'S 500', 'S 580', 'Maybach S 680'] },
      { ar: 'GLE', en: 'GLE', body: 'SUV',
        fuels: ['PETROL', 'DIESEL', 'HYBRID'], trans: ['AUTOMATIC'],
        models: ['GLE 300d', 'GLE 350', 'GLE 450', 'AMG GLE 53'] },
      { ar: 'G-Class', en: 'G-Class', body: 'SUV',
        fuels: ['PETROL'], trans: ['AUTOMATIC'],
        models: ['G 500', 'G 63 AMG', 'G 63 Edition'] },
    ]},
    { ar: 'هيونداي', en: 'Hyundai', cats: [
      { ar: 'باليسيد', en: 'Palisade', body: 'SUV',
        fuels: ['PETROL', 'DIESEL'], trans: ['AUTOMATIC'],
        models: ['GL', 'GLS', 'Calligraphy'] },
      { ar: 'سوناتا', en: 'Sonata', body: 'SEDAN',
        fuels: ['PETROL', 'HYBRID'], trans: ['AUTOMATIC'],
        models: ['GL', 'GLS', 'N-Line'] },
    ]},
    { ar: 'كيا', en: 'Kia', cats: [
      { ar: 'تيلورايد', en: 'Telluride', body: 'SUV',
        fuels: ['PETROL'], trans: ['AUTOMATIC'],
        models: ['LX', 'EX', 'SX', 'X-Pro'] },
      { ar: 'K8', en: 'K8', body: 'SEDAN',
        fuels: ['PETROL', 'HYBRID'], trans: ['AUTOMATIC'],
        models: ['2.5T', '3.5', 'Hybrid'] },
    ]},
    { ar: 'رينج روفر', en: 'Range Rover', cats: [
      { ar: 'رينج روفر', en: 'Range Rover', body: 'SUV',
        fuels: ['PETROL', 'DIESEL', 'HYBRID'], trans: ['AUTOMATIC'],
        models: ['SE', 'HSE', 'Autobiography', 'SV'] },
      { ar: 'رينج روفر سبورت', en: 'Range Rover Sport', body: 'SUV',
        fuels: ['PETROL', 'DIESEL', 'HYBRID'], trans: ['AUTOMATIC'],
        models: ['Dynamic SE', 'HSE Dynamic', 'Autobiography Dynamic', 'SVR'] },
    ]},
  ]

  const createdModels = []
  for (const b of catalog) {
    const brand = await prisma.brand.upsert({
      where: { id: `seed-${b.en}` }, update: { nameAr: b.ar, nameEn: b.en },
      create: { id: `seed-${b.en}`, nameAr: b.ar, nameEn: b.en },
    })
    for (const c of b.cats) {
      const category = await prisma.category.upsert({
        where: { id: `seed-${b.en}-${c.en}` },
        update: { nameAr: c.ar, nameEn: c.en, bodyType: c.body, fuelTypes: c.fuels, transmissions: c.trans },
        create: {
          id: `seed-${b.en}-${c.en}`, brandId: brand.id, nameAr: c.ar, nameEn: c.en,
          bodyType: c.body, fuelTypes: c.fuels, transmissions: c.trans,
        },
      })
      for (const m of c.models) {
        const model = await prisma.model.upsert({
          where: { id: `seed-${b.en}-${c.en}-${m}` }, update: {},
          create: { id: `seed-${b.en}-${c.en}-${m}`, categoryId: category.id, name: m },
        })
        createdModels.push({
          brandId: brand.id, categoryId: category.id, modelId: model.id,
          body: c.body, fuels: c.fuels, trans: c.trans,
          brandAr: b.ar, catAr: c.ar,
        })
      }
    }
  }

  console.log(`✓ Catalog seeded: ${createdModels.length} models across ${catalog.length} brands.`)

  if (!SEED_DEMO) {
    console.log('✓ Production seed complete (plans + catalog only).')
    return
  }

  // ── Demo Showroom ──
  // If DEMO_SHOWROOM_ID is set, seed into that existing showroom.
  // Otherwise create/upsert the default demo showroom.
  let showroom
  const demoShowroomId = process.env.DEMO_SHOWROOM_ID
  if (demoShowroomId) {
    showroom = await prisma.showroom.findUnique({ where: { id: demoShowroomId } })
    if (!showroom) throw new Error(`DEMO_SHOWROOM_ID "${demoShowroomId}" not found in DB`)
    // Enable marketplace on this showroom
    await prisma.showroom.update({
      where: { id: demoShowroomId },
      data: { marketplaceEnabled: true, showPrices: true, profitMarginApproved: true, commissionPct: 2.5 },
    })
    console.log(`  Using existing showroom: ${showroom.name} (${showroom.slug})`)
  } else {
    showroom = await prisma.showroom.upsert({
      where: { slug: 'al-fahad' },
      update: { name: 'معرض الفهد للسيارات', ownerName: 'فهد العتيبي' },
      create: {
        slug: 'al-fahad', name: 'معرض الفهد للسيارات', ownerName: 'فهد العتيبي',
        city: 'الرياض', tagline: 'أفضل السيارات بأفضل الأسعار',
        whatsapp: '0501234567', phone: '0112345678',
        showPrices: true, profitMarginApproved: true,
        marketplaceEnabled: true, commissionPct: 2.5,
      },
    })
  }

  if (planMap['growth']) {
    await prisma.subscription.upsert({
      where: { showroomId: showroom.id }, update: {},
      create: {
        showroomId: showroom.id, planId: planMap['growth'], status: 'ACTIVE', billingPeriod: 'MONTHLY',
        currentPeriodStart: new Date(), currentPeriodEnd: new Date(Date.now() + 30 * 864e5),
        trialEndsAt: new Date(Date.now() + 14 * 864e5),
      },
    })
  }

  // Use the first owner of the target showroom, or create a demo user
  let user = await prisma.showroomUser.findFirst({
    where: { showroomId: showroom.id, role: { in: ['SHOWROOM_OWNER', 'SHOWROOM_MANAGER'] } },
    orderBy: { createdAt: 'asc' },
  })
  if (!user) {
    const password = await bcrypt.hash('password123', 12)
    user = await prisma.showroomUser.upsert({
      where: { email: 'demo@carsell.one' }, update: {},
      create: {
        showroomId: showroom.id, name: 'فهد العتيبي', email: 'demo@carsell.one', password,
        phone: '0501234567', role: 'SHOWROOM_OWNER', accountType: 'SHOWROOM', isActive: true,
        completedSteps: ['personalInfo', 'identity', 'showroomInfo'], nationalId: '1012345678',
        idType: 'CITIZEN', nafathVerified: true, nafathVerifiedAt: new Date(), kycStatus: 'APPROVED', city: 'الرياض',
      },
    })
    console.log(`  Created demo user: demo@carsell.one / password123`)
  } else {
    console.log(`  Using existing user: ${user.email}`)
  }

  // ── Clear old demo cars ──
  await prisma.carRequest.deleteMany({ where: { showroomId: showroom.id } })
  await prisma.salePayment.deleteMany({ where: { sale: { showroomId: showroom.id } } })
  await prisma.tradeIn.deleteMany({ where: { showroomId: showroom.id } })
  await prisma.paymentTransaction.deleteMany({ where: { showroomId: showroom.id } })
  await prisma.sale.deleteMany({ where: { showroomId: showroom.id } })
  await prisma.deposit.deleteMany({ where: { showroomId: showroom.id } })
  await prisma.bid.deleteMany({ where: { car: { showroomId: showroom.id } } })
  await prisma.carTimeline.deleteMany({ where: { car: { showroomId: showroom.id } } })
  await prisma.carImage.deleteMany({ where: { car: { showroomId: showroom.id } } })
  await prisma.carDocument.deleteMany({ where: { car: { showroomId: showroom.id } } })
  await prisma.carExpense.deleteMany({ where: { car: { showroomId: showroom.id } } })
  await prisma.car.deleteMany({ where: { showroomId: showroom.id } })

  // ── Demo Cars — varied statuses, types, display modes ──
  const carSpecs = [
    // FOR_SALE - FIXED_PRICE - NEW
    { modelIdx: 0,  year: 2024, carType: 'NEW',          status: 'FOR_SALE',  displayMode: 'FIXED_PRICE', purchase: 320000, sell: 359000, km:     0, fuel: 'PETROL',  trans: 'AUTOMATIC', color: 'أبيض لؤلؤي',  listedOnMarket: true  },
    // FOR_SALE - FIXED_PRICE - USED
    { modelIdx: 4,  year: 2022, carType: 'USED',         status: 'FOR_SALE',  displayMode: 'FIXED_PRICE', purchase: 410000, sell: 449000, km: 28000, fuel: 'PETROL',  trans: 'AUTOMATIC', color: 'أسود',         listedOnMarket: true  },
    // FOR_SALE - SOUM - USED
    { modelIdx: 8,  year: 2021, carType: 'USED',         status: 'FOR_SALE',  displayMode: 'SOUM',        purchase: 175000, sell: 199000, km: 55000, fuel: 'PETROL',  trans: 'AUTOMATIC', color: 'فضي',          listedOnMarket: true  },
    // FOR_SALE - FIXED_PRICE - USED_QUALIFIED
    { modelIdx: 12, year: 2023, carType: 'USED_QUALIFIED',status:'FOR_SALE',  displayMode: 'FIXED_PRICE', purchase: 280000, sell: 309000, km: 18000, fuel: 'PETROL',  trans: 'AUTOMATIC', color: 'رمادي داكن',   listedOnMarket: true  },
    // FOR_SALE - SOUM - NEW
    { modelIdx: 16, year: 2024, carType: 'NEW',          status: 'FOR_SALE',  displayMode: 'SOUM',        purchase: 520000, sell: 565000, km:     0, fuel: 'PETROL',  trans: 'AUTOMATIC', color: 'أبيض',         listedOnMarket: true  },
    // FOR_SALE - not listed on market
    { modelIdx: 2,  year: 2020, carType: 'USED',         status: 'FOR_SALE',  displayMode: 'FIXED_PRICE', purchase: 95000,  sell: 112000, km: 82000, fuel: 'DIESEL',  trans: 'MANUAL',    color: 'أحمر',         listedOnMarket: false },
    // AUCTION - PUBLIC
    { modelIdx: 20, year: 2022, carType: 'USED',         status: 'AUCTION',   displayMode: 'AUCTION',     purchase: 340000, sell: 380000, km: 32000, fuel: 'PETROL',  trans: 'AUTOMATIC', color: 'أسود',         listedOnMarket: true,
      auctionType: 'PUBLIC', auctionOpeningPrice: 340000, auctionHoursFromNow: 48 },
    // AUCTION - PUBLIC (ending soon)
    { modelIdx: 24, year: 2023, carType: 'NEW',          status: 'AUCTION',   displayMode: 'AUCTION',     purchase: 580000, sell: 620000, km:  5000, fuel: 'PETROL',  trans: 'AUTOMATIC', color: 'أبيض لؤلؤي',  listedOnMarket: true,
      auctionType: 'PUBLIC', auctionOpeningPrice: 580000, auctionHoursFromNow: 6 },
    // AUCTION - PRIVATE
    { modelIdx: 5,  year: 2021, carType: 'USED',         status: 'AUCTION',   displayMode: 'AUCTION',     purchase: 195000, sell: 225000, km: 60000, fuel: 'HYBRID',  trans: 'AUTOMATIC', color: 'أزرق',         listedOnMarket: false,
      auctionType: 'PRIVATE', auctionOpeningPrice: 195000, auctionHoursFromNow: 24 },
    // RESERVED
    { modelIdx: 9,  year: 2022, carType: 'USED',         status: 'RESERVED',  displayMode: 'FIXED_PRICE', purchase: 215000, sell: 249000, km: 41000, fuel: 'PETROL',  trans: 'AUTOMATIC', color: 'بيج',          listedOnMarket: false },
    // RESERVED
    { modelIdx: 13, year: 2023, carType: 'USED_QUALIFIED',status:'RESERVED',  displayMode: 'SOUM',        purchase: 375000, sell: 415000, km: 22000, fuel: 'PETROL',  trans: 'AUTOMATIC', color: 'رمادي',        listedOnMarket: false },
    // SOLD
    { modelIdx: 1,  year: 2021, carType: 'USED',         status: 'SOLD',      displayMode: 'FIXED_PRICE', purchase: 148000, sell: 172000, km: 68000, fuel: 'PETROL',  trans: 'AUTOMATIC', color: 'أسود',         listedOnMarket: false },
    // SOLD
    { modelIdx: 17, year: 2022, carType: 'USED',         status: 'SOLD',      displayMode: 'FIXED_PRICE', purchase: 270000, sell: 305000, km: 35000, fuel: 'PETROL',  trans: 'AUTOMATIC', color: 'أبيض',         listedOnMarket: false },
    // SOLD
    { modelIdx: 21, year: 2020, carType: 'USED',         status: 'SOLD',      displayMode: 'SOUM',        purchase: 380000, sell: 425000, km: 52000, fuel: 'PETROL',  trans: 'AUTOMATIC', color: 'فضي',          listedOnMarket: false },
    // DRAFT
    { modelIdx: 25, year: 2024, carType: 'NEW',          status: 'DRAFT',     displayMode: 'FIXED_PRICE', purchase: 890000, sell: null,   km:     0, fuel: 'PETROL',  trans: 'AUTOMATIC', color: 'أخضر',         listedOnMarket: false },
    // DRAFT
    { modelIdx: 3,  year: 2019, carType: 'USED',         status: 'DRAFT',     displayMode: 'FIXED_PRICE', purchase: 82000,  sell: null,   km: 110000,fuel: 'DIESEL',  trans: 'MANUAL',    color: 'أبيض',         listedOnMarket: false },
    // FOR_SALE - Hybrid
    { modelIdx: 6,  year: 2023, carType: 'USED_QUALIFIED',status:'FOR_SALE',  displayMode: 'FIXED_PRICE', purchase: 165000, sell: 188000, km: 25000, fuel: 'HYBRID',  trans: 'AUTOMATIC', color: 'أبيض',         listedOnMarket: true  },
    // FOR_SALE - Electric (if supported by enum; else HYBRID)
    { modelIdx: 10, year: 2024, carType: 'NEW',          status: 'FOR_SALE',  displayMode: 'FIXED_PRICE', purchase: 210000, sell: 235000, km:     0, fuel: 'HYBRID',  trans: 'AUTOMATIC', color: 'أزرق سماوي',   listedOnMarket: true  },
    // FOR_SALE - luxury
    { modelIdx: 22, year: 2024, carType: 'NEW',          status: 'FOR_SALE',  displayMode: 'FIXED_PRICE', purchase: 750000, sell: 825000, km:     0, fuel: 'PETROL',  trans: 'AUTOMATIC', color: 'أسود',         listedOnMarket: true  },
    // FOR_SALE - luxury soum
    { modelIdx: 26, year: 2023, carType: 'USED',         status: 'FOR_SALE',  displayMode: 'SOUM',        purchase: 620000, sell: 679000, km: 15000, fuel: 'PETROL',  trans: 'AUTOMATIC', color: 'أبيض لؤلؤي',  listedOnMarket: true  },
  ]

  const colors = ['أبيض لؤلؤي','أسود','رمادي داكن','فضي','بيج','أزرق','أحمر','أخضر زيتوني','برونزي']
  const createdCars = []

  for (let i = 0; i < carSpecs.length; i++) {
    const spec = carSpecs[i]
    const pick = createdModels[spec.modelIdx % createdModels.length]
    const fuel = spec.fuel || pick.fuels[0] || 'PETROL'
    const trans = spec.trans || pick.trans[0] || 'AUTOMATIC'

    const car = await prisma.car.create({
      data: {
        showroomId:   showroom.id,
        carRefNumber: i + 1,
        brandId:      pick.brandId,
        categoryId:   pick.categoryId,
        modelId:      pick.modelId,
        year:         spec.year,
        carType:      spec.carType,
        bodyType:     spec.body || pick.body,
        colorExt:     spec.color || colors[i % colors.length],
        colorInt:     'بيج',
        fuelType:     fuel,
        transmission: trans,
        odometer:     spec.km,
        vin:          `CS${String(100000 + i * 777).padStart(6,'0')}DEMO${i}`,
        status:       spec.status,
        displayMode:  spec.displayMode,
        purchasePrice: spec.purchase,
        sellPrice:    spec.sell,
        extraCosts:   3500 + i * 150,
        plateNumber:  `ر س م ${1000 + i}`,
        plateType:    'PRIVATE',
        listedOnMarket: spec.listedOnMarket,
        marketPrice:  spec.listedOnMarket && spec.sell ? spec.sell : null,
        dataSource:   'MANUAL',
        createdBy:    user.id,
        ...(spec.status === 'AUCTION' ? {
          auctionType:         spec.auctionType ?? 'PUBLIC',
          auctionStartAt:      new Date(),
          auctionEndsAt:       new Date(Date.now() + (spec.auctionHoursFromNow ?? 24) * 3600000),
          auctionOpeningPrice: spec.auctionOpeningPrice ?? spec.purchase,
        } : {}),
      },
    })

    await prisma.carTimeline.create({
      data: { carId: car.id, userId: user.id, eventType: 'CAR_CREATED', payload: { source: 'SEED' } },
    })

    createdCars.push({ car, spec, pick })
  }

  console.log(`✓ ${createdCars.length} demo cars created.`)

  // ── Car Requests (بايرز يطلبون سيارات) ──
  const forSaleCars = createdCars.filter(c => c.spec.status === 'FOR_SALE' && c.spec.listedOnMarket)

  const requestDefs = [
    { carIdx: 0, type: 'RESERVATION',  status: 'PENDING',   name: 'عبدالله الرشيد',  phone: '0501111222', message: 'أريد حجز هذه السيارة، متى يمكن معاينتها؟' },
    { carIdx: 1, type: 'SOUM_OFFER',   status: 'PENDING',   name: 'محمد الزهراني',   phone: '0502222333', offer: 430000, message: 'هل السعر قابل للتفاوض؟' },
    { carIdx: 2, type: 'PURCHASE',     status: 'ACCEPTED',  name: 'سعد القحطاني',    phone: '0503333444', message: 'أريد الشراء نقداً فوراً' },
    { carIdx: 3, type: 'SOUM_OFFER',   status: 'ACCEPTED',  name: 'فيصل الحربي',     phone: '0504444555', offer: 295000, message: 'عرضي نهائي' },
    { carIdx: 4, type: 'RESERVATION',  status: 'COMPLETED', name: 'ناصر العنزي',     phone: '0505555666', message: 'تم الاتفاق مع المعرض' },
    { carIdx: 0, type: 'SOUM_OFFER',   status: 'REJECTED',  name: 'طارق السبيعي',    phone: '0506666777', offer: 320000, message: 'أقل سعر ممكن؟' },
    { carIdx: 1, type: 'RESERVATION',  status: 'PENDING',   name: 'بندر المالكي',    phone: '0507777888', message: 'سأحضر غداً للمعاينة' },
    { carIdx: 2, type: 'PURCHASE',     status: 'PENDING',   name: 'عمر الشمري',      phone: '0508888999', message: 'هل يمكن التمويل؟' },
  ]

  for (const req of requestDefs) {
    const target = forSaleCars[req.carIdx % forSaleCars.length]
    if (!target) continue
    await prisma.carRequest.create({
      data: {
        carId:       target.car.id,
        showroomId:  showroom.id,
        type:        req.type,
        status:      req.status,
        buyerName:   req.name,
        buyerPhone:  req.phone,
        offerAmount: req.offer ?? null,
        message:     req.message ?? null,
      },
    })
  }

  console.log(`✓ ${requestDefs.length} car requests created.`)

  // ── Bids on auction cars ──
  const auctionCars = createdCars.filter(c => c.spec.status === 'AUCTION')
  for (const { car, spec } of auctionCars) {
    if (!spec.auctionOpeningPrice) continue
    let currentBid = spec.auctionOpeningPrice
    for (let b = 0; b < 3; b++) {
      currentBid += 5000 + b * 2000
      await prisma.bid.create({
        data: {
          carId: car.id, bidderId: user.id,
          amount: currentBid,
          createdAt: new Date(Date.now() - (3 - b) * 3600000),
        },
      })
    }
  }

  console.log(`✓ Bids added on auction cars.`)

  console.log('\n══════════════════════════════════════')
  console.log('✓ SEED COMPLETE')
  console.log('  Demo login:  demo@carsell.one / password123')
  console.log('  Admin login: set SUPER_ADMIN_EMAIL + SUPER_ADMIN_PASSWORD in env')
  console.log('══════════════════════════════════════\n')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
