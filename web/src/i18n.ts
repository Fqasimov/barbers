// Every text on the landing page, in Azerbaijani, Russian and English.

export const LANGS = ['az', 'ru', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export type Loc = Record<Lang, string>;
export type Feature = Loc & { soon?: boolean };
export type Plan = {
  id: 'sade' | 'ferdi' | 'start' | 'pro' | 'couture' | 'couture_plus';
  /** beauty: salons and barbershops (the main market); couture: brand showrooms. */
  market: 'beauty' | 'couture';
  name: string;
  price: number;
  recommended?: boolean;
  blurb: Loc;
  features: Feature[];
};
export type CategoryId = 'barber' | 'hair' | 'nails' | 'brows' | 'spa' | 'makeup' | 'aesthetics' | 'couture';

export const dict = {
  // Meta
  metaTitle: {
    az: 'yazılnow: onlayn bron və qeyd — salon, bərbərxana, showroom | Bakı',
    ru: 'yazılnow: онлайн-запись и бронирование — салоны, барбершопы, шоурумы | Баку',
    en: 'yazılnow: online booking and appointments — salons, barbers, showrooms | Baku',
  },
  metaDesc: {
    az: 'Bakıda onlayn bron, qeyd və rezervasiya: bərbərxana, gözəllik salonu, kosmetologiya və couture showroomlarının boş vaxtlarını görün, zəngsiz yazılın. Bizneslər üçün onlayn qeyd sistemi, 30 gün pulsuz.',
    ru: 'Онлайн-запись и бронирование в Баку: свободное время барбершопов, салонов, косметологий и шоурумов, запись без звонков. Система онлайн-записи для бизнеса, 30 дней бесплатно.',
    en: 'Online booking and appointments in Baku: see free times at barbershops, beauty salons, aesthetic clinics and couture showrooms and book without a call. An online booking system for businesses, 30 days free.',
  },

  // Navigation
  skip: { az: 'Əsas məzmuna keç', ru: 'К основному содержанию', en: 'Skip to content' },
  navAbout: { az: 'Biz kimik', ru: 'О нас', en: 'About' },
  navWhy: { az: 'Niyə yazılnow', ru: 'Почему yazılnow', en: 'Why yazılnow' },
  navMap: { az: 'Xəritə', ru: 'Карта', en: 'Map' },
  navJoin: { az: 'Salonlar üçün', ru: 'Для салонов', en: 'For salons' },
  navCta: { az: 'Salonu qoş', ru: 'Подключить салон', en: 'List your salon' },
  navPanel: { az: 'Salon paneli', ru: 'Панель салона', en: 'Salon panel' },
  joinPanel: {
    az: 'Qeydiyyatdan keçib hər şeyi saytdan idarə edin: təqvim, ustalar, xidmətlər, rəylər, statistika.',
    ru: 'Зарегистрируйтесь и управляйте всем на сайте: календарь, мастера, услуги, отзывы, статистика.',
    en: 'Register and run everything on the website: calendar, masters, services, reviews, statistics.',
  },
  joinPanelCta: { az: 'Salon panelini aç', ru: 'Открыть панель салона', en: 'Open the salon panel' },
  menu: { az: 'Menyu', ru: 'Меню', en: 'Menu' },
  demoRibbon: {
    az: 'Önizləmə: nümunə məlumatlar göstərilir',
    ru: 'Превью: показаны примерные данные',
    en: 'Preview: showing sample data',
  },
  skipIntro: { az: 'Keç', ru: 'Пропустить', en: 'Skip' },

  // Hero
  heroKicker: {
    az: 'Bakı · onlayn bron: salonlar, bərbərxanalar, showroomlar',
    ru: 'Баку · онлайн-запись: салоны, барбершопы, шоурумы',
    en: 'Baku · online booking: salons, barbers, showrooms',
  },
  // The part after | is set in the accent colour on its own line.
  heroTitle: {
    az: 'Bakının ustaları,|bir toxunuşla.',
    ru: 'Мастера Баку —|в одно касание.',
    en: 'Baku’s best hands,|one tap away.',
  },
  heroSub: {
    az: 'Boş vaxtları canlı görün, ustanı özünüz seçin və zəng etmədən yazılın. Ödəniş salonda, kart lazım deyil.',
    ru: 'Смотрите свободное время онлайн, выбирайте мастера и записывайтесь без звонков. Оплата в салоне, карта не нужна.',
    en: 'See live free times, choose your master and book without a phone call. You pay at the salon, no card needed.',
  },
  storeSoon: { az: 'Tezliklə', ru: 'Скоро', en: 'Coming soon' },
  heroForSalons: {
    az: 'Salonunuz var? 30 gün pulsuz',
    ru: 'У вас салон? 30 дней бесплатно',
    en: 'Own a salon? 30 days free',
  },
  heroCats: { az: 'Kateqoriyalar', ru: 'Категории', en: 'Categories' },
  phoneAlt: {
    az: 'yazılnow tətbiqi: Bakıdakı salonlar, boş vaxt axtarışı və xəritə',
    ru: 'Приложение yazılnow: салоны Баку, поиск свободного времени и карта',
    en: 'The yazılnow app: Baku salons, a free-time search and the map',
  },

  // About
  aboutKicker: { az: 'Biz kimik', ru: 'Кто мы', en: 'Who we are' },
  aboutTitle: { az: 'Bakıda, Bakı üçün qurulub.', ru: 'Сделано в Баку — для Баку.', en: 'Built in Baku, for Baku.' },
  aboutBody1: {
    az: 'yazılnow-u yaxşı ustaya yazılmaq üçün hələ də zəng edən, WhatsApp-da cavab gözləyən, "sabah saat neçədə boşsunuz?" soruşan insanlar üçün qurduq. Biz bu şəhərdə yaşayırıq və həmin növbələri özümüz də tuturuq.',
    ru: 'Мы сделали yazılnow для тех, кто до сих пор звонит, ждёт ответа в WhatsApp и спрашивает «а завтра во сколько можно?», чтобы попасть к хорошему мастеру. Мы живём в этом городе и сами записываемся в те же салоны.',
    en: 'We built yazılnow for everyone who still calls, waits on WhatsApp and asks “what time are you free tomorrow?” just to see a good master. We live in this city and book the same chairs ourselves.',
  },
  aboutBody2: {
    az: 'Salonlar üçün isə məqsədimiz sadədir: dəftəri, zəngləri və unudulmuş növbələri bir təqvimə yığmaq, həm də hər yeni usta üçün əlavə pul istəmədən.',
    ru: 'А для салонов цель простая: собрать тетрадь, звонки и забытые записи в один календарь — и не брать деньги за каждого нового мастера.',
    en: 'For salons the goal is simple: put the notebook, the calls and the forgotten bookings into one calendar, without charging for every new master.',
  },
  aboutFact1: {
    az: 'Azərbaycan, rus və ingilis dillərində',
    ru: 'На азербайджанском, русском и английском',
    en: 'In Azerbaijani, Russian and English',
  },
  aboutFact2: {
    az: 'Müştərilər üçün həmişə pulsuz',
    ru: 'Для клиентов всегда бесплатно',
    en: 'Always free for clients',
  },
  aboutFact3: {
    az: 'Yerli komanda, yerli dəstək',
    ru: 'Местная команда и поддержка',
    en: 'A local team, local support',
  },

  // Why
  whyKicker: { az: 'Niyə yazılnow', ru: 'Почему yazılnow', en: 'Why yazılnow' },
  whyTitle: {
    az: 'Başqa platformalardan fərqimiz.',
    ru: 'Чем мы отличаемся от других.',
    en: 'What makes us different.',
  },
  whySub: {
    az: 'Bir çox yazılış xidməti salonu hər usta, hər növbə və hər klik üçün ödəməyə məcbur edir. Biz bunu fərqli qurduq.',
    ru: 'Многие сервисы записи берут с салона за каждого мастера, каждую запись и каждый клик. Мы устроили всё иначе.',
    en: 'Many booking services charge salons per master, per booking and per click. We built it differently.',
  },
  why1Title: { az: 'Usta sayına görə ödəniş yoxdur', ru: 'Без доплат за мастеров', en: 'No fee per master' },
  why1Body: {
    az: 'Komanda böyüyür, qiymət yox. Bütün planlara limitsiz usta daxildir.',
    ru: 'Команда растёт, цена — нет. Во всех тарифах мастера без ограничений.',
    en: 'Your team grows, the price doesn’t. Every plan includes unlimited masters.',
  },
  why2Title: { az: 'Növbədən komissiya yoxdur', ru: 'Без комиссии с записи', en: 'No commission on bookings' },
  why2Body: {
    az: 'Sabit aylıq plan. 10 növbə də olsa, 1000 növbə də olsa eyni qiymət.',
    ru: 'Фиксированный тариф в месяц. 10 записей или 1000 — цена одна.',
    en: 'One flat monthly plan. Ten bookings or a thousand, the price is the same.',
  },
  why3Title: { az: 'Yalnız real rəylər', ru: 'Только настоящие отзывы', en: 'Only real reviews' },
  why3Body: {
    az: 'Rəyi yalnız salonda olmuş müştəri yaza bilər: tətbiqdəki növbədən sonra və ya ustanın göstərdiyi birdəfəlik QR kodla.',
    ru: 'Отзыв оставляет только тот, кто был в салоне: после записи в приложении или по одноразовому QR-коду мастера.',
    en: 'Only people who were actually there can review: after a booking in the app, or with a one-time QR code the master shows at the chair.',
  },
  why4Title: { az: 'Pulunuza toxunmuruq', ru: 'Мы не трогаем ваши деньги', en: 'We never touch your money' },
  why4Body: {
    az: 'Müştəri ödənişi salonda edir, kart tələb olunmur. Pul birbaşa sizə gəlir.',
    ru: 'Клиент платит в салоне, карта не нужна. Деньги сразу у вас.',
    en: 'Clients pay at the salon, no card required. The money goes straight to you.',
  },
  why5Title: {
    az: 'Telefon zəngləri də təqvimdə',
    ru: 'Звонки тоже в календаре',
    en: 'Phone calls in the same calendar',
  },
  why5Body: {
    az: 'Zəngləri, birbaşa gələnləri və istirahət vaxtını yazın, eyni vaxt iki dəfə satılmasın.',
    ru: 'Записывайте звонки, клиентов без записи и нерабочее время, чтобы одно время не продавалось дважды.',
    en: 'Add phone calls, walk-ins and time off, so the same slot is never sold twice.',
  },
  why6Title: { az: 'Boş vaxt canlı görünür', ru: 'Свободное время онлайн', en: 'Free times, live' },
  why6Body: {
    az: '"Bu gün 18:00-dan sonra fade" axtarın, yazılnow ən yaxın boş vaxtları göstərsin.',
    ru: 'Ищите «fade сегодня после 18:00», и yazılnow покажет ближайшие окна.',
    en: 'Search “fade today after 6 pm” and yazılnow shows the nearest openings.',
  },
  cmpTitle: { az: 'Müqayisə', ru: 'Сравнение', en: 'Side by side' },
  cmpOthers: { az: 'Adi platformalar', ru: 'Типичные сервисы', en: 'Typical services' },
  cmpRow1: { az: 'Əlavə usta üçün ödəniş', ru: 'Плата за каждого мастера', en: 'Charge per extra master' },
  cmpRow2: { az: 'Hər növbədən komissiya', ru: 'Комиссия с каждой записи', en: 'Commission per booking' },
  cmpRow3: { az: 'Rəy yalnız ziyarətdən sonra', ru: 'Отзыв только после визита', en: 'Reviews only after a visit' },
  cmpRow4: { az: 'Müştəridən kart tələb olunmur', ru: 'Карта клиента не нужна', en: 'No card needed from clients' },
  cmpRow5: { az: 'Kartsız pulsuz sınaq', ru: 'Пробный период без карты', en: 'Free trial without a card' },
  cmpNo: { az: 'Yox', ru: 'Нет', en: 'No' },
  cmpYes: { az: 'Bəli', ru: 'Да', en: 'Yes' },
  cmpOften: { az: 'Çox vaxt', ru: 'Часто', en: 'Often' },
  cmpNotAlways: { az: 'Hər zaman yox', ru: 'Не всегда', en: 'Not always' },

  // Stats
  statsKicker: { az: 'Rəqəmlərlə', ru: 'В цифрах', en: 'In numbers' },
  statsTitle: {
    az: 'Şəbəkəmiz hər gün böyüyür.',
    ru: 'Наша сеть растёт каждый день.',
    en: 'Our network grows every day.',
  },
  statSalons: { az: 'Partnyor məkan', ru: 'Партнёрских мест', en: 'Partner places' },
  statMasters: { az: 'Usta', ru: 'Мастеров', en: 'Masters' },
  statBookings: { az: 'Edilmiş yazılış', ru: 'Записей сделано', en: 'Bookings made' },
  statClients: { az: 'Müştəri', ru: 'Клиентов', en: 'Clients' },
  statRating: { az: 'Orta reytinq', ru: 'Средний рейтинг', en: 'Average rating' },
  statDistricts: { az: 'Rayon', ru: 'Районов', en: 'Districts' },
  statsUpdated: { az: 'Yenilənib: {time}', ru: 'Обновлено: {time}', en: 'Updated {time}' },
  statsPending: { az: 'Rəqəmlər tezliklə burada olacaq', ru: 'Цифры скоро появятся', en: 'Figures coming soon' },

  // Map
  mapKicker: { az: 'Xəritə', ru: 'Карта', en: 'Map' },
  mapTitle: { az: 'Partnyorlarımız xəritədə.', ru: 'Наши партнёры на карте.', en: 'Our partners on the map.' },
  mapSub: {
    az: 'Nöqtənin üzərinə gəlin: reytinq, ünvan və son rəylər.',
    ru: 'Наведите на точку: рейтинг, адрес и свежие отзывы.',
    en: 'Hover a pin to see the rating, address and latest reviews.',
  },
  mapSubTouch: {
    az: 'Nöqtəyə toxunun: reytinq, ünvan və son rəylər.',
    ru: 'Нажмите на точку: рейтинг, адрес и свежие отзывы.',
    en: 'Tap a pin to see the rating, address and latest reviews.',
  },
  mapAll: { az: 'Hamısı', ru: 'Все', en: 'All' },
  mapCount: { az: '{n} məkan', ru: '{n} мест', en: '{n} places' },
  mapLoading: { az: 'Xəritə yüklənir…', ru: 'Загружаем карту…', en: 'Loading the map…' },
  mapError: { az: 'Xəritəni yükləmək olmadı.', ru: 'Не удалось загрузить карту.', en: 'The map couldn’t load.' },
  mapEmpty: {
    az: 'İlk partnyorlar tezliklə burada olacaq.',
    ru: 'Первые партнёры скоро появятся здесь.',
    en: 'The first partners will appear here soon.',
  },
  reviewsN: { az: '{n} rəy', ru: '{n} отзывов', en: '{n} reviews' },
  latestReviews: { az: 'Son rəylər', ru: 'Свежие отзывы', en: 'Latest reviews' },
  noReviews: { az: 'Hələ rəy yoxdur', ru: 'Пока нет отзывов', en: 'No reviews yet' },
  reviewsLoading: { az: 'Rəylər yüklənir…', ru: 'Загружаем отзывы…', en: 'Loading reviews…' },
  listTitle: { az: 'Bütün məkanlar', ru: 'Все места', en: 'All places' },
  close: { az: 'Bağla', ru: 'Закрыть', en: 'Close' },

  // Join (registration)
  joinKicker: { az: 'Salonlar üçün', ru: 'Для салонов', en: 'For salons' },
  joinTitle: {
    az: 'Salonunuzu 15 dəqiqəyə qoşun.',
    ru: 'Подключите салон за 15 минут.',
    en: 'Put your salon on yazılnow in 15 minutes.',
  },
  joinSub: {
    az: 'Bərbərxana, gözəllik salonu, dırnaq və qaş studiyası, spa, kosmetologiya mərkəzi: hamısı üçün eyni sadə qeydiyyat.',
    ru: 'Барбершоп, салон красоты, ногтевая или бровная студия, спа, косметология — для всех одна простая регистрация.',
    en: 'Barbershops, beauty salons, nail and brow studios, spas, aesthetic clinics: one simple sign-up for all.',
  },
  joinPoint1: {
    az: '30 gün pulsuz, kart lazım deyil',
    ru: '30 дней бесплатно, без карты',
    en: '30 days free, no card',
  },
  joinPoint2: {
    az: 'Limitsiz usta, əlavə ödəniş yoxdur',
    ru: 'Мастера без ограничений и доплат',
    en: 'Unlimited masters, no extra fees',
  },
  joinPoint3: {
    az: 'Hər yeni növbə üçün bildiriş',
    ru: 'Уведомление о каждой новой записи',
    en: 'An alert for every new booking',
  },
  joinPoint4: {
    az: 'Bir iş günü ərzində yoxlanılır və axtarışda görünür',
    ru: 'Проверим за рабочий день — и вы в поиске',
    en: 'Checked within a working day, then live in search',
  },
  // The same section for a couture brand (picked in pricing, or with the switch above the form).
  joinPanelCouture: {
    az: 'Hər şeyi saytda idarə edin: təqvim, stilistlər, xidmətlər, rəylər, statistika.',
    ru: 'Управляйте всем на сайте: календарь, стилисты, услуги, отзывы, статистика.',
    en: 'Run everything on the website: calendar, stylists, services, reviews, statistics.',
  },
  joinPanelCtaCouture: { az: 'Showroom panelini aç', ru: 'Открыть панель шоурума', en: 'Open the showroom panel' },
  joinKickerCouture: { az: 'Couture brendlər üçün', ru: 'Для кутюр-брендов', en: 'For couture brands' },
  joinTitleCouture: {
    az: 'Showroomunuzu 15 dəqiqəyə qoşun.',
    ru: 'Подключите шоурум за 15 минут.',
    en: 'Put your showroom on yazılnow in 15 minutes.',
  },
  joinSubCouture: {
    az: 'Müştərilər showroomunuza gəlib modelləri geyinib baxmaq üçün onlayn qeyd olunur: vaxt, stilist, depozit.',
    ru: 'Клиенты онлайн записываются в шоурум на примерку: время, стилист, депозит.',
    en: 'Clients book online to visit your showroom and try pieces on: time, stylist and deposit.',
  },
  joinPoint2Couture: {
    az: 'Limitsiz stilist, əlavə ödəniş yoxdur',
    ru: 'Стилисты без ограничений и доплат',
    en: 'Unlimited stylists, no extra fees',
  },
  joinStep2Couture: {
    az: 'Xidmətləri (showroom ziyarəti, ölçü), stilistləri və şəkilləri əlavə edin',
    ru: 'Добавьте услуги (визит, примерка), стилистов и фото',
    en: 'Add services (showroom visit, fitting), stylists and photos',
  },
  stepSalonCouture: { az: 'Showroom', ru: 'Шоурум', en: 'Showroom' },
  joinKindBeauty: { az: 'Salon / bərbərxana', ru: 'Салон / барбершоп', en: 'Salon / barbershop' },
  joinKindCouture: { az: 'Couture brend', ru: 'Кутюр-бренд', en: 'Couture brand' },
  joinKindLabel: { az: 'Biznesinizin növü', ru: 'Тип бизнеса', en: 'Your kind of business' },
  joinSteps: { az: 'Necə işləyir', ru: 'Как это работает', en: 'How it works' },
  joinStep1: { az: 'Burada qeydiyyatdan keçin', ru: 'Зарегистрируйтесь здесь', en: 'Sign up here' },
  joinStep2: {
    az: 'Tətbiqdə xidmət, usta və şəkilləri əlavə edin',
    ru: 'Добавьте в приложении услуги, мастеров и фото',
    en: 'Add services, masters and photos in the app',
  },
  joinStep3: {
    az: 'Yoxlamadan sonra müştərilər yazılmağa başlayır',
    ru: 'После проверки клиенты начинают записываться',
    en: 'After a quick check, clients start booking',
  },

  stepOwner: { az: 'Siz', ru: 'Вы', en: 'You' },
  stepSalon: { az: 'Salon', ru: 'Салон', en: 'Salon' },
  stepCode: { az: 'Kod', ru: 'Код', en: 'Code' },
  stepPlan: { az: 'Plan', ru: 'Тариф', en: 'Plan' },
  stepOf: { az: 'Addım {n}/4', ru: 'Шаг {n} из 4', en: 'Step {n} of 4' },

  fFirst: { az: 'Ad', ru: 'Имя', en: 'First name' },
  fLast: { az: 'Soyad', ru: 'Фамилия', en: 'Last name' },
  fPhone: { az: 'Mobil nömrə', ru: 'Мобильный номер', en: 'Mobile number' },
  fEmail: { az: 'E-poçt', ru: 'E-mail', en: 'Email' },
  fPassword: { az: 'Şifrə', ru: 'Пароль', en: 'Password' },
  fPasswordHint: {
    az: 'Ən azı 8 simvol, hərf və rəqəm',
    ru: 'Минимум 8 символов, буквы и цифры',
    en: 'At least 8 characters, letters and digits',
  },
  showPassword: { az: 'Şifrəni göstər', ru: 'Показать пароль', en: 'Show password' },
  fSalonName: { az: 'Məkanın adı', ru: 'Название', en: 'Business name' },
  fSalonNamePh: { az: 'Məs. Old Town Barbers', ru: 'Напр. Old Town Barbers', en: 'E.g. Old Town Barbers' },
  fCategories: { az: 'Xidmət növləri', ru: 'Виды услуг', en: 'What you offer' },
  fCategoriesHint: { az: 'Bir neçəsini seçə bilərsiniz', ru: 'Можно выбрать несколько', en: 'Pick all that apply' },
  fAudience: { az: 'Kimlərə xidmət edirsiniz', ru: 'Кого обслуживаете', en: 'Who you serve' },
  audAll: { az: 'Hamıya', ru: 'Всех', en: 'Everyone' },
  audWomen: { az: 'Yalnız qadınlar', ru: 'Только женщин', en: 'Women only' },
  audMen: { az: 'Yalnız kişilər', ru: 'Только мужчин', en: 'Men only' },
  fDistrict: { az: 'Rayon', ru: 'Район', en: 'District' },
  fDistrictPh: { az: 'Məs. Səbail', ru: 'Напр. Сабаил', en: 'E.g. Sabail' },
  fAddress: { az: 'Ünvan', ru: 'Адрес', en: 'Address' },
  fAddressPh: { az: 'Küçə, bina', ru: 'Улица, дом', en: 'Street and building' },
  // [text](link) becomes a link.
  consent: {
    az: 'Davam etməklə [İstifadə şərtləri](/terms/) və [Məxfilik siyasəti](/privacy/) ilə razılaşırsınız.',
    ru: 'Продолжая, вы соглашаетесь с [Условиями использования](/terms/) и [Политикой конфиденциальности](/privacy/).',
    en: 'By continuing you agree to the [Terms of use](/terms/) and the [Privacy policy](/privacy/).',
  },
  next: { az: 'Davam et', ru: 'Далее', en: 'Continue' },
  back: { az: 'Geri', ru: 'Назад', en: 'Back' },
  sendCode: { az: 'Kodu göndər', ru: 'Отправить код', en: 'Send the code' },
  codeTitle: { az: 'E-poçtunuzu təsdiqləyin', ru: 'Подтвердите e-mail', en: 'Confirm your email' },
  codeSub: {
    az: '{email} ünvanına 6 rəqəmli kod göndərdik.',
    ru: 'Мы отправили 6-значный код на {email}.',
    en: 'We sent a 6-digit code to {email}.',
  },
  codeLabel: { az: 'Təsdiq kodu', ru: 'Код подтверждения', en: 'Verification code' },
  codeDemo: { az: 'Demo kod: {code}', ru: 'Демо-код: {code}', en: 'Demo code: {code}' },
  resend: { az: 'Kodu yenidən göndər', ru: 'Отправить код ещё раз', en: 'Send a new code' },
  resendIn: { az: 'Yeni kod {s} san. sonra', ru: 'Новый код через {s} с', en: 'New code in {s}s' },
  resent: { az: 'Yeni kod göndərildi', ru: 'Новый код отправлен', en: 'New code sent' },
  changeEmail: { az: 'E-poçtu dəyiş', ru: 'Изменить e-mail', en: 'Change email' },
  verify: { az: 'Təsdiqlə', ru: 'Подтвердить', en: 'Verify' },
  planTitle: { az: 'Plan seçin', ru: 'Выберите тариф', en: 'Choose a plan' },
  planSub: {
    az: 'İlk 30 gün hər plan pulsuzdur. Sonra istənilən vaxt dəyişə və ya ləğv edə bilərsiniz.',
    ru: 'Первые 30 дней любой тариф бесплатен. Потом его можно сменить или отменить в любой момент.',
    en: 'Every plan is free for the first 30 days. Change or cancel any time after that.',
  },
  trialBadge: { az: 'İlk 30 gün pulsuz', ru: 'Первые 30 дней бесплатно', en: 'First 30 days free' },
  yearDeal: {
    az: 'İllik ödənişdə 12 ay 10 ayın qiymətinə',
    ru: 'При оплате за год 12 месяцев по цене 10',
    en: 'Pay yearly: 12 months for the price of 10',
  },
  trialNote: {
    az: 'Sınaq bitənə qədər heç bir ödəniş alınmır. Ödəniş üsulunu sonra əlavə edəcəksiniz.',
    ru: 'До конца пробного периода ничего не списывается. Способ оплаты добавите позже.',
    en: 'Nothing is charged during the trial. You’ll add a payment method later.',
  },
  trialTerms: {
    az: 'Sınağa başlamaqla İstifadə şərtləri və Məxfilik siyasəti ilə razılaşırsınız. İstənilən vaxt ləğv edə bilərsiniz.',
    ru: 'Начиная пробный период, вы соглашаетесь с Условиями использования и Политикой конфиденциальности. Отменить можно в любой момент.',
    en: 'By starting the trial you agree to the Terms of Use and Privacy Policy. Cancel any time.',
  },
  perMonth: { az: '/ay', ru: '/мес', en: '/mo' },
  afterTrial: { az: 'sınaqdan sonra', ru: 'после пробного периода', en: 'after the trial' },
  recommended: { az: 'Tövsiyə', ru: 'Рекомендуем', en: 'Recommended' },
  soon: { az: 'tezliklə', ru: 'скоро', en: 'coming soon' },
  startTrial: {
    az: '30 günlük pulsuz sınağa başla',
    ru: 'Начать 30 дней бесплатно',
    en: 'Start the 30-day free trial',
  },
  doneTitle: { az: 'Xoş gəldiniz, {name}!', ru: 'Добро пожаловать, {name}!', en: 'Welcome, {name}!' },
  doneBody: {
    az: '{salon} qeydə alındı və sınaq başladı. İndi tətbiqi yükləyin, eyni e-poçt və şifrə ilə daxil olun və xidmətləri, ustaları və şəkilləri əlavə edin. Bundan sonra salonu bir iş günü ərzində yoxlayırıq.',
    ru: '{salon} зарегистрирован, пробный период начался. Скачайте приложение, войдите с тем же e-mail и паролем и добавьте услуги, мастеров и фото. После этого мы проверим салон в течение рабочего дня.',
    en: '{salon} is registered and your trial has started. Download the app, sign in with the same email and password, and add your services, masters and photos. We then check the salon within a working day.',
  },
  doneDemo: {
    az: 'Bu önizləmədir: məlumatlar heç yerə göndərilmədi.',
    ru: 'Это превью: данные никуда не отправлены.',
    en: 'This is a preview: nothing was sent anywhere.',
  },
  again: { az: 'Başqa salon qeyd et', ru: 'Зарегистрировать ещё один', en: 'Register another' },

  // Errors
  errRequired: { az: 'Bu sahəni doldurun', ru: 'Заполните это поле', en: 'Fill in this field' },
  errName: {
    az: 'Yalnız hərflər, 2–40 simvol',
    ru: 'Только буквы, 2–40 символов',
    en: 'Letters only, 2–40 characters',
  },
  errPhone: {
    az: 'Azərbaycan mobil nömrəsi: 50 123 45 67',
    ru: 'Мобильный номер Азербайджана: 50 123 45 67',
    en: 'An Azerbaijani mobile number: 50 123 45 67',
  },
  errEmail: { az: 'Düzgün e-poçt ünvanı yazın', ru: 'Введите корректный e-mail', en: 'Enter a valid email' },
  errPasswordLength: {
    az: 'Şifrə 8–64 simvol olmalıdır',
    ru: 'Пароль — от 8 до 64 символов',
    en: 'Use 8–64 characters',
  },
  errPasswordMix: {
    az: 'Hərf və rəqəm birlikdə olmalıdır',
    ru: 'Нужны и буквы, и цифры',
    en: 'Use both letters and digits',
  },
  errShort: { az: 'Ən azı 2 simvol', ru: 'Минимум 2 символа', en: 'At least 2 characters' },
  errCategories: { az: 'Ən azı birini seçin', ru: 'Выберите хотя бы одно', en: 'Pick at least one' },
  errCode: { az: 'Kodun 6 rəqəmini yazın', ru: 'Введите 6 цифр кода', en: 'Enter all 6 digits' },
  errEmailTaken: {
    az: 'Bu e-poçtla hesab artıq var. Tətbiqdə daxil olun.',
    ru: 'Аккаунт с этим e-mail уже есть. Войдите в приложении.',
    en: 'An account with this email already exists. Sign in in the app.',
  },
  errOtpInvalid: { az: 'Kod səhvdir', ru: 'Неверный код', en: 'That code is wrong' },
  errOtpExpired: {
    az: 'Kodun vaxtı bitib. Yenisini istəyin.',
    ru: 'Срок кода истёк. Запросите новый.',
    en: 'The code has expired. Ask for a new one.',
  },
  errTooMany: {
    az: 'Çox cəhd oldu. Bir az sonra yenidən yoxlayın.',
    ru: 'Слишком много попыток. Попробуйте позже.',
    en: 'Too many attempts. Try again a little later.',
  },
  errResendSoon: {
    az: 'Yeni kod üçün bir az gözləyin',
    ru: 'Подождите немного перед новым кодом',
    en: 'Wait a moment before asking for a new code',
  },
  errNetwork: {
    az: 'Bağlantı yoxdur. Yenidən cəhd edin.',
    ru: 'Нет соединения. Попробуйте ещё раз.',
    en: 'No connection. Try again.',
  },
  errUnknown: {
    az: 'Nəsə alınmadı. Yenidən cəhd edin.',
    ru: 'Что-то пошло не так. Попробуйте ещё раз.',
    en: 'Something went wrong. Try again.',
  },

  // Download band
  getTitle: {
    az: 'Növbəti növbəniz bir toxunuş uzaqlıqdadır.',
    ru: 'Следующая запись — в одно касание.',
    en: 'Your next booking is one tap away.',
  },
  getSub: {
    az: 'iPhone və Android üçün pulsuz.',
    ru: 'Бесплатно для iPhone и Android.',
    en: 'Free for iPhone and Android.',
  },

  // FAQ
  faqTitle: { az: 'Tez-tez verilən suallar', ru: 'Частые вопросы', en: 'Questions' },
  faq1Q: {
    az: 'yazılnow müştərilər üçün pulludur?',
    ru: 'yazılnow платный для клиентов?',
    en: 'Does yazılnow cost clients anything?',
  },
  faq1A: {
    az: 'Xeyr. Xidmətin pulunu salonda ödəyirsiniz, tətbiq pulsuzdur.',
    ru: 'Нет. За услугу вы платите в салоне, приложение бесплатное.',
    en: 'No. You pay the salon for the service; the app is free.',
  },
  faq2Q: { az: 'Salon üçün qiymət nə qədərdir?', ru: 'Сколько стоит для салона?', en: 'What does it cost a salon?' },
  faq2A: {
    az: 'İlk 30 gün pulsuzdur. Sonra sabit aylıq plan: usta sayına və növbə sayına görə əlavə ödəniş yoxdur.',
    ru: 'Первые 30 дней бесплатно. Дальше фиксированный тариф в месяц, без доплат за мастеров и записи.',
    en: 'The first 30 days are free. Then one flat monthly plan, with no extra fees per master or per booking.',
  },
  faq3Q: {
    az: 'Telefonla yazılan müştərilər necə olacaq?',
    ru: 'А клиенты, которые записываются по телефону?',
    en: 'What about clients who book by phone?',
  },
  faq3A: {
    az: 'Onları tətbiqdə "Növbə yaz" ilə əlavə edirsiniz və həmin vaxt dərhal məşğul görünür. Nahar və istirahət günlərini də bağlaya bilərsiniz.',
    ru: 'Добавляете их в приложении через «Записать» — и это время сразу становится занятым. Обед и выходные тоже можно закрыть.',
    en: 'Add them in the app with “Add booking” and that time is taken right away. You can close off lunch and days off too.',
  },
  faq4Q: { az: 'Rəylər saxta ola bilərmi?', ru: 'Могут ли отзывы быть фальшивыми?', en: 'Can reviews be fake?' },
  faq4A: {
    az: 'Rəyi yalnız növbəsi olmuş müştəri yaza bilər. Hər rəyin altında "Şikayət et" düyməsi var və şikayətləri 24 saat ərzində yoxlayırıq.',
    ru: 'Отзыв может оставить только клиент после визита. Под каждым отзывом есть «Пожаловаться», жалобы проверяем за 24 часа.',
    en: 'Only clients with a booking can review. Every review has a “Report” button, and we check reports within 24 hours.',
  },
  faqMore: { az: 'Bütün suallar', ru: 'Все вопросы', en: 'All questions' },

  // Footer
  footPrivacy: { az: 'Məxfilik siyasəti', ru: 'Конфиденциальность', en: 'Privacy policy' },
  footTerms: { az: 'İstifadə şərtləri', ru: 'Условия использования', en: 'Terms of use' },
  footHelp: { az: 'Kömək', ru: 'Помощь', en: 'Help' },
  footContact: { az: 'Əlaqə', ru: 'Контакты', en: 'Contact' },
  footRights: {
    az: '© {year} yazılnow. Bütün hüquqlar qorunur.',
    ru: '© {year} yazılnow. Все права защищены.',
    en: '© {year} yazılnow. All rights reserved.',
  },
  footVoen: { az: 'VÖEN', ru: 'ВОЕН', en: 'Tax ID (VÖEN)' },

  // Pricing, by market
  navPricing: { az: 'Qiymətlər', ru: 'Цены', en: 'Pricing' },
  openWebApp: { az: 'Boş vaxt tap', ru: 'Найти свободное время', en: 'Find a free slot' },
  pricingKicker: { az: 'Qiymətlər', ru: 'Цены', en: 'Pricing' },
  pricingTitle: {
    az: 'Hər biznes üçün öz planı.',
    ru: 'Свой тариф для каждого бизнеса.',
    en: 'A plan for every kind of business.',
  },
  pricingSub: {
    az: 'Müştərilər üçün həmişə pulsuz. Bizneslər üçün ilk 30 gün pulsuz, kart tələb olunmur, komissiya yoxdur.',
    ru: 'Для клиентов всегда бесплатно. Для бизнеса первые 30 дней бесплатно, без карты и без комиссии.',
    en: 'Always free for clients. For businesses the first 30 days are free, no card, no commission.',
  },
  marketBeauty: { az: 'Salonlar və bərbərxanalar', ru: 'Салоны и барбершопы', en: 'Salons and barbershops' },
  marketBeautySub: {
    az: 'Bərbər, saç, dırnaq, qaş, spa, makiyaj və kosmetologiya.',
    ru: 'Барберы, волосы, ногти, брови, спа, макияж и косметология.',
    en: 'Barbers, hair, nails, brows, spa, makeup and aesthetics.',
  },
  marketBeautyShort: { az: 'Salonlar', ru: 'Салоны', en: 'Salons' },
  marketCoutureShort: { az: 'Couture', ru: 'Кутюр', en: 'Couture' },
  marketCouture: { az: 'Couture brendlər', ru: 'Кутюр-бренды', en: 'Couture brands' },
  marketCoutureSub: {
    az: 'Müştərilər showroomunuza gəlib modelləri geyinib baxmaq üçün onlayn qeyd olunur: vaxt, stilist, ödəniş — hamısı bir paneldə.',
    ru: 'Клиенты онлайн записываются в ваш шоурум на примерку: время, стилист, депозит — всё в одной панели.',
    en: 'Clients book online to visit your showroom and try pieces on: time, stylist and deposit, all in one dashboard.',
  },
  perMonthShort: { az: '/ ay', ru: '/ мес', en: '/ month' },
  pricingCta: { az: '30 gün pulsuz başla', ru: 'Начать 30 дней бесплатно', en: 'Start 30 days free' },
  pricingPicked: { az: 'Seçildi ✓', ru: 'Выбрано ✓', en: 'Selected ✓' },
  pricingFor: { az: 'Plan kimin üçündür?', ru: 'Для какого бизнеса тариф?', en: 'Which business is it for?' },
} satisfies Record<string, Loc>;

export type Key = keyof typeof dict;

/** The market a set of categories belongs to: a couture showroom, or a beauty business. */
export const marketOf = (cats: readonly CategoryId[]): Plan['market'] =>
  cats.length && cats.every((c) => c === 'couture') ? 'couture' : 'beauty';

// Business categories, the same ids as the app and the API.
export const categories: { id: CategoryId; label: Loc }[] = [
  { id: 'barber', label: { az: 'Bərbər', ru: 'Барбер', en: 'Barber' } },
  { id: 'hair', label: { az: 'Saç', ru: 'Волосы', en: 'Hair' } },
  { id: 'nails', label: { az: 'Dırnaq', ru: 'Ногти', en: 'Nails' } },
  { id: 'brows', label: { az: 'Qaş və kirpik', ru: 'Брови и ресницы', en: 'Brows & lashes' } },
  { id: 'spa', label: { az: 'Spa', ru: 'Спа', en: 'Spa' } },
  { id: 'makeup', label: { az: 'Makiyaj', ru: 'Макияж', en: 'Makeup' } },
  { id: 'aesthetics', label: { az: 'Kosmetologiya', ru: 'Косметология', en: 'Aesthetics' } },
  { id: 'couture', label: { az: 'Couture showroom', ru: 'Кутюр-шоурум', en: 'Couture showroom' } },
];

// Plans, as in the app (src/auth/plans.ts). Prices come from GET /api/plans when the API is set.
export const plans: Plan[] = [
  {
    id: 'ferdi',
    market: 'beauty',
    name: 'Fərdi',
    price: 10,
    blurb: { az: 'Tək işləyən usta üçün', ru: 'Для мастера, работающего один', en: 'For one master working solo' },
    features: [
      {
        az: 'Start planındakı hər şey, bir nəfər üçün',
        ru: 'Всё из тарифа Start для одного человека',
        en: 'Everything in Start, for one person',
      },
      {
        az: 'Instagram bio üçün bron linki: yazilnow.az/u/adınız',
        ru: 'Ссылка для записи в био Instagram: yazilnow.az/u/имя',
        en: 'A booking link for your Instagram bio: yazilnow.az/u/yourname',
      },
      {
        az: 'Onlayn bron, təqvim və xatırlatmalar',
        ru: 'Онлайн-запись, календарь и напоминания',
        en: 'Online booking, calendar and reminders',
      },
      {
        az: 'Salonda işləyirsinizsə də, öz səhifəniz olur',
        ru: 'Подходит и мастеру внутри салона',
        en: 'Also for a master working inside a salon',
      },
    ],
  },
  {
    id: 'start',
    market: 'beauty',
    name: 'Start',
    price: 29,
    recommended: true,
    blurb: { az: 'Tək salon üçün', ru: 'Для одного салона', en: 'For a single salon' },
    features: [
      {
        az: 'Xəritədə yer, QR rəylər və foto qalereya',
        ru: 'Место на карте, отзывы по QR и фотогалерея',
        en: 'On the map, with QR reviews and a photo gallery',
      },
      { az: 'Onlayn bron və təqvim', ru: 'Онлайн-запись и календарь', en: 'Online booking and calendar' },
      {
        az: 'Instagram bio üçün bron linki: ustalar, saatlar, boş vaxtlar',
        ru: 'Ссылка для записи в био Instagram: мастера, часы, свободное время',
        en: 'A booking link for your Instagram bio: masters, hours, free times',
      },
      {
        az: 'Limitsiz usta, əlavə ödəniş yoxdur',
        ru: 'Мастера без ограничений и доплат',
        en: 'Unlimited masters, no per-seat fees',
      },
      { az: 'Müştərilərə xatırlatmalar', ru: 'Напоминания клиентам', en: 'Reminders for clients' },
      {
        az: 'WhatsApp təsdiqləri: əlavə paket, 10 ₼ / 300 mesaj',
        ru: 'Подтверждения в WhatsApp: пакет 10 ₼ / 300 сообщений',
        en: 'WhatsApp confirmations: add-on, 10 ₼ / 300 messages',
      },
    ],
  },
  {
    id: 'pro',
    market: 'beauty',
    name: 'Pro',
    price: 49,
    blurb: { az: 'Böyüyən salonlar üçün', ru: 'Для растущих салонов', en: 'For growing salons' },
    features: [
      { az: 'Start planındakı hər şey', ru: 'Всё из тарифа Start', en: 'Everything in Start' },
      {
        az: '3 filial daxildir (hər əlavə filial +15 ₼)',
        ru: '3 филиала включены (+15 ₼ за каждый следующий)',
        en: 'Up to 3 branches included (+15 ₼ per extra branch)',
      },
      {
        az: 'Bir bron linki: müştəri əvvəlcə filialı seçir',
        ru: 'Одна ссылка для записи: клиент сначала выбирает филиал',
        en: 'One booking link: clients pick a branch first',
      },
      { az: 'Filiallar üzrə ümumi hesabat', ru: 'Сводные отчёты по филиалам', en: 'Combined reports across branches' },
      { az: 'Filial menecerləri', ru: 'Роли менеджеров филиалов', en: 'Branch manager roles' },
      { az: 'Gəlməmə qorunması və depozit', ru: 'Защита от неявок и депозиты', en: 'No-show protection and deposits' },
      { az: 'Gözləmə siyahısı və statistika', ru: 'Лист ожидания и статистика', en: 'Waitlist and statistics' },
      {
        az: 'Prioritet dəstək və telefon xətti',
        ru: 'Приоритетная поддержка и телефон',
        en: 'Priority support and a phone line',
      },
    ],
  },
  {
    id: 'couture',
    market: 'couture',
    name: 'Couture',
    price: 39,
    recommended: true,
    blurb: { az: 'Bir showroom üçün', ru: 'Для одного шоурума', en: 'For one showroom' },
    features: [
      {
        az: 'Showroom ziyarəti və geyinib baxmaq üçün onlayn qeyd',
        ru: 'Онлайн-запись на визит в шоурум и примерку',
        en: 'Online appointments to visit the showroom and try pieces on',
      },
      { az: '1 showroom', ru: '1 шоурум', en: '1 showroom' },
      {
        az: 'Stilistlər, menecerlər, depozit və statistika',
        ru: 'Стилисты, менеджеры, депозиты и статистика',
        en: 'Stylists, managers, deposits and statistics',
      },
      {
        az: 'Instagram bio üçün qeyd linki',
        ru: 'Ссылка для записи в био Instagram',
        en: 'A booking link for your Instagram bio',
      },
    ],
  },
  {
    id: 'couture_plus',
    market: 'couture',
    name: 'Couture Plus',
    price: 59,
    blurb: { az: '3 showroomadək', ru: 'До 3 шоурумов', en: 'Up to 3 showrooms' },
    features: [
      { az: 'Couture planındakı hər şey', ru: 'Всё из тарифа Couture', en: 'Everything in Couture' },
      {
        az: '3 showroom daxildir (hər əlavəsi +15 ₼)',
        ru: '3 шоурума включены (+15 ₼ за каждый следующий)',
        en: 'Up to 3 showrooms included (+15 ₼ per extra one)',
      },
      {
        az: 'Bir qeyd linki: müştəri əvvəlcə showroomu seçir',
        ru: 'Одна ссылка для записи: клиент сначала выбирает шоурум',
        en: 'One booking link: clients pick a showroom first',
      },
      {
        az: 'Showroomlar üzrə ümumi hesabat',
        ru: 'Сводные отчёты по шоурумам',
        en: 'Combined reports across showrooms',
      },
    ],
  },
];
