import type { StringKey } from './strings';
import type { Loc } from './types';

const L = (az: string, ru: string, en: string): Loc => ({ az, ru, en });

/**
 * A couture brand's dashboard says showroom and stylist where a salon's says salon and master.
 * Only these keys change; everything else reads the same for both kinds of business.
 */
export const coutureStrings: Partial<Record<StringKey, Loc>> = {
  branchesTitle: L('Showroomlar', 'Шоурумы', 'Showrooms'),
  bizSalonTitle: L('Showroom haqqında', 'О шоуруме', 'About the showroom'),
  bkAllMasters: L('Bütün stilistlər', 'Все стилисты', 'All stylists'),
  bkBySalon: L('Showroom yazıb', 'Записал шоурум', 'Added by the showroom'),
  branchAdded: L(
    'Showroom əlavə olundu. Ona keçib stilistləri əlavə edin.',
    'Шоурум добавлен. Переключитесь и добавьте стилистов.',
    'Showroom added. Switch to it and add stylists.',
  ),
  branchRemoveBody: L(
    'Showroom axtarışdan çıxacaq. Stilistlər və xidmətlər silinəcək.',
    'Шоурум исчезнет из поиска. Стилисты и услуги будут удалены.',
    'The showroom leaves search. Its stylists and services are removed.',
  ),
  clicksSub: L('Showroom səhifənizdə nəyə toxunublar', 'Что нажимали на странице шоурума', 'What people tapped on your showroom page'),
  dashManage: L('Showroomu idarə et', 'Управление шоурумом', 'Run your showroom'),
  depositKept: L('Depozit showroomda qaldı', 'Депозит удержан', 'Deposit kept'),
  detailsTitle: L('Showroom haqqında', 'О шоуруме', 'Showroom details'),
  errMasterSkills: L(
    'Bu stilist seçilən xidmətlərin hamısını etmir',
    'Стилист делает не все выбранные услуги',
    'This stylist doesn’t do every chosen service',
  ),
  errPickMaster: L('Stilist seçin', 'Выберите стилиста', 'Pick a stylist'),
  fAbout: L('Showroom haqqında (istəyə görə)', 'О шоуруме (по желанию)', 'About the showroom (optional)'),
  fMaster: L('Stilist', 'Стилист', 'Stylist'),
  fSalonName: L('Brendin / showroomun adı', 'Название бренда / шоурума', 'Brand / showroom name'),
  linkBody: L(
    'Instagram bio-ya qoyun və ya müştərilərə göndərin: stilistləri, iş saatlarını və boş vaxtları görüb dərhal yazılırlar.',
    'Добавьте в био Instagram или отправьте клиентам: они увидят стилистов, часы работы и свободное время и сразу запишутся.',
    'Put it in your Instagram bio or send it to clients: they see your stylists, hours and free times, and book straight away.',
  ),
  linkBodyPro: L(
    'Instagram bio-ya qoyun və ya müştərilərə göndərin: showroomu seçir, stilistləri, iş saatlarını və boş vaxtları görüb dərhal yazılırlar.',
    'Добавьте в био Instagram или отправьте клиентам: они выберут шоурум, увидят стилистов, часы работы и свободное время и сразу запишутся.',
    'Put it in your Instagram bio or send it to clients: they pick a showroom, see your stylists, hours and free times, and book straight away.',
  ),
  linkPickAddress: L(
    'Daha qısa ünvan istəyirsiniz? Showroom məlumatlarında şəxsi səhifə ünvanı seçin.',
    'Хотите адрес короче? Выберите адрес личной страницы в данных шоурума.',
    'Want a shorter link? Pick a personal page address in your showroom details.',
  ),
  mainSalon: L('Əsas showroom', 'Основной шоурум', 'Main showroom'),
  mstAdd: L('Stilist əlavə et', 'Добавить стилиста', 'Add a stylist'),
  mstDeleteTitle: L('Stilist silinsin?', 'Удалить стилиста?', 'Remove this stylist?'),
  mstEdit: L('Stilisti dəyiş', 'Изменить стилиста', 'Edit stylist'),
  mstEmptyTitle: L('Hələ stilist yoxdur', 'Пока нет стилистов', 'No stylists yet'),
  mstNew: L('Yeni stilist', 'Новый стилист', 'New stylist'),
  mstTitle: L('Stilistlər', 'Стилисты', 'Stylists'),
  nbNeedSetup: L('Əvvəlcə xidmət və stilist əlavə edin.', 'Сначала добавьте услуги и стилистов.', 'Add services and stylists first.'),
  paymentDueBody: L(
    'Showroom {date} tarixinədək axtarışda qalır və qeyd qəbul edir. Ödəniş edilməsə, sonra gizlənəcək; mövcud qeydlər qüvvədə qalır.',
    'Шоурум остаётся в поиске и принимает записи до {date}. Без оплаты он затем скроется; существующие записи сохранятся.',
    'Your showroom stays in search and takes bookings until {date}. Without payment it is hidden after that; existing bookings stay.',
  ),
  phAbout: L('Showroomunuzu bir neçə cümlə ilə təsvir edin', 'Опишите шоурум в нескольких предложениях', 'Describe your showroom in a few sentences'),
  phSalonName: L('Brendin adını daxil edin', 'Введите название бренда', 'Enter the brand name'),
  photosSub: L(
    'Showroomunuzun, kolleksiyanızın və komandanızın şəkilləri. 12-yə qədər.',
    'Фото шоурума, коллекции и команды. До 12 штук.',
    'Photos of your showroom, your collection and your team. Up to 12.',
  ),
  planExpiredBody: L(
    'Showroom axtarışda görünmür və yeni qeyd qəbul etmir. Mövcud qeydlər qüvvədədir.',
    'Шоурум скрыт из поиска и не принимает новые записи. Существующие записи действуют.',
    'Your showroom is hidden from search and takes no new bookings. Existing bookings still stand.',
  ),
  qrAnyMaster: L('Showroom', 'Шоурум', 'The showroom'),
  qrWallBody: L(
    'Sabit kod yalnız showroom səhifənizi açır, rəy yazdırmır. Çap edib girişə vurun.',
    'Постоянный код открывает только страницу шоурума, без отзыва. Распечатайте для входа.',
    'A fixed code that only opens your showroom page, never a review. Print it for the door.',
  ),
  setupMasters: L('Ən azı bir stilist əlavə edin', 'Добавьте хотя бы одного стилиста', 'Add at least one stylist'),
  setupSub: L(
    'Showroom axtarışda görünməzdən əvvəl bunlar lazımdır.',
    'Это нужно, чтобы шоурум появился в поиске.',
    'Your showroom needs these before it appears in search.',
  ),
  statsByMaster: L('Stilistlər üzrə', 'По стилистам', 'By stylist'),
  statusReview: L(
    'Yoxlanılır. Showroomunuz 1–2 iş günü ərzində axtarışda görünəcək.',
    'На проверке. Шоурум появится в поиске в течение 1–2 рабочих дней.',
    'Under review. Your showroom appears in search within 1–2 working days.',
  ),
  teamInvited: L(
    'Dəvət göndərildi. Bu e-poçtla daxil olanda paneli görəcək.',
    'Приглашение отправлено. Войдя с этим e-mail, человек увидит панель.',
    'Invited. Signing in with this email opens the showroom panel.',
  ),
  teamSub: L(
    'Menecer təqvimi, stilistləri, xidmətləri və rəyləri idarə edir. Ödəniş və showroomlar sizdə qalır.',
    'Менеджер ведёт календарь, стилистов, услуги и отзывы. Оплата и шоурумы остаются у вас.',
    'A manager runs the calendar, stylists, services and reviews. Billing and showrooms stay with you.',
  ),
  trialEndingSoon: L(
    'Sınaq tezliklə bitir. Showroomun axtarışda qalması üçün ödəniş üsulunu əlavə edin. Sınaq bitənə qədər heç nə alınmır.',
    'Пробный период скоро закончится. Добавьте способ оплаты, чтобы шоурум остался в поиске. До конца периода ничего не списывается.',
    'Your trial ends soon. Add a payment method to stay in search. Nothing is charged before the trial ends.',
  ),
};

/** "1 master" → "1 stylist" in a couture dashboard. */
export const coutureForms = {
  master: { az: ['stilist'], ru: ['стилист', 'стилиста', 'стилистов'], en: ['stylist', 'stylists'] },
} as const;
