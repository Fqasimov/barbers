// Every text on the landing page, in Azerbaijani, Russian and English.

export const LANGS = ['az', 'ru', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export type Loc = Record<Lang, string>;
export type Feature = Loc & { soon?: boolean };
export type Plan = {
  id: 'start' | 'pro';
  name: string;
  price: number;
  recommended?: boolean;
  blurb: Loc;
  features: Feature[];
};
export type CategoryId = 'barber' | 'hair' | 'nails' | 'brows' | 'spa' | 'makeup' | 'aesthetics';

export const dict = {
  // Meta
  metaTitle: {
    az: 'yazılnow: Bakının bərbər, salon və kosmetologiya yazılışı',
    ru: 'yazılnow: запись в барбершопы, салоны и косметологии Баку',
    en: 'yazılnow: book Baku’s barbers, salons and aesthetic clinics',
  },
  metaDesc: {
    az: 'Bakının bərbərxana, gözəllik salonu və kosmetologiya mərkəzlərinin boş vaxtlarını canlı görün və zəngsiz yazılın. Salonlar üçün: usta sayına görə ödəniş yoxdur, 30 gün pulsuz.',
    ru: 'Свободное время барбершопов, салонов красоты и косметологий Баку онлайн, запись без звонков. Для салонов: без доплат за мастеров, 30 дней бесплатно.',
    en: 'See live free times at Baku’s barbershops, beauty salons and aesthetic clinics and book without a call. For salons: no per-master fees, 30 days free.',
  },

  // Navigation
  skip: { az: 'Əsas məzmuna keç', ru: 'К основному содержанию', en: 'Skip to content' },
  navAbout: { az: 'Biz kimik', ru: 'О нас', en: 'About' },
  navWhy: { az: 'Niyə yazılnow', ru: 'Почему yazılnow', en: 'Why yazılnow' },
  navMap: { az: 'Xəritə', ru: 'Карта', en: 'Map' },
  navJoin: { az: 'Salonlar üçün', ru: 'Для салонов', en: 'For salons' },
  navCta: { az: 'Salonu qoş', ru: 'Подключить салон', en: 'List your salon' },
  menu: { az: 'Menyu', ru: 'Меню', en: 'Menu' },
  demoRibbon: {
    az: 'Önizləmə: nümunə məlumatlar göstərilir',
    ru: 'Превью: показаны примерные данные',
    en: 'Preview: showing sample data',
  },
  skipIntro: { az: 'Keç', ru: 'Пропустить', en: 'Skip' },

  // Hero
  heroKicker: {
    az: 'Bakı · bərbər, salon, kosmetologiya',
    ru: 'Баку · барберы, салоны, косметология',
    en: 'Baku · barbers, salons, aesthetics',
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
    az: 'Rəyi yalnız həmin salonda növbəsi olmuş müştəri yaza bilər. Hər rəy təsdiqlənmiş ziyarətə bağlıdır.',
    ru: 'Отзыв может оставить только клиент, у которого была запись. Каждый отзыв привязан к подтверждённому визиту.',
    en: 'Only clients who had a booking can review. Every review is tied to a confirmed visit.',
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
} satisfies Record<string, Loc>;

export type Key = keyof typeof dict;

// Business categories, the same ids as the app and the API.
export const categories: { id: CategoryId; label: Loc }[] = [
  { id: 'barber', label: { az: 'Bərbər', ru: 'Барбер', en: 'Barber' } },
  { id: 'hair', label: { az: 'Saç', ru: 'Волосы', en: 'Hair' } },
  { id: 'nails', label: { az: 'Dırnaq', ru: 'Ногти', en: 'Nails' } },
  { id: 'brows', label: { az: 'Qaş və kirpik', ru: 'Брови и ресницы', en: 'Brows & lashes' } },
  { id: 'spa', label: { az: 'Spa', ru: 'Спа', en: 'Spa' } },
  { id: 'makeup', label: { az: 'Makiyaj', ru: 'Макияж', en: 'Makeup' } },
  { id: 'aesthetics', label: { az: 'Kosmetologiya', ru: 'Косметология', en: 'Aesthetics' } },
];

// Plans, as in the app (src/auth/plans.ts). Prices come from GET /api/plans when the API is set.
export const plans: Plan[] = [
  {
    id: 'start',
    name: 'Start',
    price: 29,
    blurb: { az: 'Tək salon üçün', ru: 'Для одного салона', en: 'For a single salon' },
    features: [
      { az: 'Onlayn bron və təqvim', ru: 'Онлайн-запись и календарь', en: 'Online booking and calendar' },
      {
        az: 'Limitsiz usta, əlavə ödəniş yoxdur',
        ru: 'Мастера без ограничений и доплат',
        en: 'Unlimited masters, no per-seat fees',
      },
      { az: 'WhatsApp ilə təsdiq', ru: 'Подтверждения в WhatsApp', en: 'WhatsApp confirmations', soon: true },
      { az: 'Rəylərə cavab', ru: 'Ответы на отзывы', en: 'Replies to reviews' },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    recommended: true,
    blurb: { az: 'Böyüyən salonlar üçün', ru: 'Для растущих салонов', en: 'For growing salons' },
    features: [
      { az: 'Start planındakı hər şey', ru: 'Всё из тарифа Start', en: 'Everything in Start' },
      {
        az: 'Gəlməmə qorunması və depozit',
        ru: 'Защита от неявок и депозиты',
        en: 'No-show protection and deposits',
        soon: true,
      },
      { az: 'Müştərilərə xatırlatmalar', ru: 'Напоминания клиентам', en: 'Reminders for clients' },
      { az: 'Gözləmə siyahısı', ru: 'Лист ожидания', en: 'Waitlist', soon: true },
      { az: 'Statistika', ru: 'Статистика', en: 'Statistics', soon: true },
    ],
  },
];
