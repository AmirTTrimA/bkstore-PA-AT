import random
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify

from accounts.models import Address
from cart.models import Cart, CartItem, Order, OrderItem, WishlistItem
from cart.services import CheckoutService
from catalog.models import Author, Book, BookFormat
from content.models import License
from pricing.models import (
    Discount,
    DiscountCode,
    Price,
    SubscriptionPlan,
    UserSubscription,
)
from publishing.models import (
    AuthorCreateProposal,
    AuthorUpdateProposal,
    BookCreateProposal,
    BookDeleteProposal,
    BookUpdateProposal,
    PriceChangeProposal,
    Proposal,
    Publisher,
    PublisherMembership,
)
from wallet.models import Wallet, WalletTransaction

User = get_user_model()


class Command(BaseCommand):
    help = (
        "Purges existing books, authors, publishers and related records, "
        "then populates the database with an authentic, realistic Iranian bookstore catalog."
    )

    DEMO_USERS = [
        ("alice", "Alice Johnson"),
        ("bob", "Bob Smith"),
        ("charlie", "Charlie Brown"),
        ("diana", "Diana Miller"),
        ("emma", "Emma Davis"),
        ("farah", "Farah Hassan"),
        ("george", "George Wilson"),
        ("henry", "Henry Clark"),
        ("isabella", "Isabella Moore"),
        ("jack", "Jack Taylor"),
        ("kate", "Kate Anderson"),
        ("liam", "Liam Thomas"),
        ("mia", "Mia Martin"),
        ("noah", "Noah White"),
        ("olivia", "Olivia Harris"),
        ("peter", "Peter Lewis"),
        ("quinn", "Quinn Walker"),
        ("ruby", "Ruby Hall"),
        ("sam", "Sam Young"),
        ("victoria", "Victoria King"),
    ]
    PASSWORD = "demo12345"

    # =========================================================================
    # 1. Authentic Iranian Publishers (Matching frontend Allpublisher.jsx)
    # =========================================================================
    REAL_PUBLISHERS = [
        {
            "slug": "ofogh",
            "name": "نشر افق (Ofogh Publications)",
            "website": "https://ofoqbooks.com",
            "email": "info@ofoqbooks.com",
            "description": "از معتبرترین ناشران ایران در زمینه رمان، ادبیات معاصر، شاهکارهای ترجمه و ادبیات جوانان.",
        },
        {
            "slug": "porteghal",
            "name": "انتشارات پرتقال (Porteghal)",
            "website": "https://porteghal.com",
            "email": "info@porteghal.com",
            "description": "ناشر برتر کتاب‌های هیجان‌انگیز، علمی‌تخیلی و فانتزی برای نسل جوان و کتاب‌دوستان.",
        },
        {
            "slug": "avanameh",
            "name": "آوانامه (Avanameh Audiobooks)",
            "website": "https://avanameh.com",
            "email": "contact@avanameh.com",
            "description": "پیشگام تولید کتاب‌های صوتی با کیفیت در ایران با صدای برجسته‌ترین گویندگان و هنرمندان.",
        },
        {
            "slug": "nasle-no",
            "name": "انتشارات نسل نو اندیش (Nasle Noandish)",
            "website": "https://naslenoandish.com",
            "email": "info@naslenoandish.com",
            "description": "تخصصی‌ترین ناشر کتاب‌های موفقیت، مدیریت، مهندسی نرم‌افزار، استارتاپ و روانشناسی رشد.",
        },
        {
            "slug": "negah",
            "name": "انتشارات نگاه (Negah Publications)",
            "website": "https://negahpub.com",
            "email": "info@negahpub.com",
            "description": "بیش از نیم قرن سابقه در انتشار آثار کلاسیک ادبیات ایران، شعر، تاریخ و رمان‌های جاودانه.",
        },
        {
            "slug": "cheshmeh",
            "name": "نشر چشمه (Cheshmeh Publications)",
            "website": "https://cheshmeh.ir",
            "email": "info@cheshmeh.ir",
            "description": "از پرمخاطب‌ترین ناشران کشور در حوزه‌های ادبیات داستانی ایران، فلسفه، علوم اجتماعی و هنر.",
        },
        {
            "slug": "mah-ava",
            "name": "ماه‌آوا (Mah Ava Audiobooks)",
            "website": "https://mahava.ir",
            "email": "info@mahava.ir",
            "description": "موسسه تولید و نشر کتاب‌های گویای ادبیات معاصر و جهان با رویکرد مدرن و شنیدنی.",
        },
        {
            "slug": "khili-sabz",
            "name": "انتشارات خیلی سبز (Kheili Sabz)",
            "website": "https://kheilisabz.com",
            "email": "info@kheilisabz.com",
            "description": "ناشر پیشرو در کتب علوم پایه، فیزیک، فناوری و آموزش‌های استاندارد دانشگاهی و کاربردی.",
        },
        {
            "slug": "noon",
            "name": "نشر نون (Noon Publications)",
            "website": "https://noonbook.ir",
            "email": "info@noonbook.ir",
            "description": "ناشر تخصصی رمان‌های روز جهان، داستان‌های پرفروش نیویورک تایمز و آثار روانشناختی و خودیاری.",
        },
        {
            "slug": "rozane",
            "name": "نشر روزنه (Rozaneh Publications)",
            "website": "https://rowzanehnashr.com",
            "email": "info@rowzanehnashr.com",
            "description": "انتشار کتاب‌های مرجع در زمینه تاریخ، علوم انسانی، علوم سیاسی و ادبیات اندیشه‌ورز.",
        },
    ]

    # =========================================================================
    # 2. Prominent Iranian & International Authors
    # =========================================================================
    REAL_AUTHORS = [
        {
            "name": "صادق هدایت (Sadegh Hedayat)",
            "biography": "پیشگام داستان‌نویسی مدرن ایران و نویسنده شاهکار جاودان «بوف کور»؛ یکی از برجسته‌ترین ادیبان سده بیستم آسیا.",
        },
        {
            "name": "بزرگ علوی (Bozorg Alavi)",
            "biography": "نویسنده، استاد زبان فارسی و فعال سیاسی معاصر؛ آفریننده رمان‌های تأثیرگذاری چون «چشم‌هایش» و «چمدان».",
        },
        {
            "name": "سیمین دانشور (Simin Daneshvar)",
            "biography": "نخستین زن نویسنده نامدار رمان در تاریخ ادبیات فارسی و خالق رمان درخشان «سووشون».",
        },
        {
            "name": "محمود دولت‌آبادی (Mahmoud Dowlatabadi)",
            "biography": "رمان‌نویس و نمایشنامه‌نویس برجسته معاصر؛ آفریننده حماسه ده جلدی «کلیدر» و «جای خالی سلوچ».",
        },
        {
            "name": "هوشنگ گلشیری (Houshang Golshiri)",
            "biography": "داستان‌نویس معاصر و استاد تکنیک‌های داستان‌نویسی مدرن؛ نویسنده رمان کم‌نظیر «شازده احتجاب».",
        },
        {
            "name": "عباس معروفی (Abbas Maroufi)",
            "biography": "نویسنده، نمایشنامه‌نویس و مدیر نشریه ادبی گردون؛ نویسنده اثر فراموش‌نشدنی «سمفونی مردگان».",
        },
        {
            "name": "زویا پیرزاد (Zoya Pirzad)",
            "biography": "نویسنده پرمخاطب ارمنی‌تبار ایرانی؛ برنده جوایز متعدد ادبی برای کتاب «چراغ‌ها را من خاموش می‌کنم».",
        },
        {
            "name": "نادر ابراهیمی (Nader Ebrahimi)",
            "biography": "ادیب، شاعر، فیلم‌ساز و ترانه‌سرای معاصر؛ خالق عاشقانه‌های پاک و حکمت‌آمیز ادبیات فارسی همچون «یک عاشقانه آرام».",
        },
        {
            "name": "رضا امیرخانی (Reza Amirkhani)",
            "biography": "نویسنده معاصر و پژوهشگر ادبی؛ صاحب رمان‌های پرتیراژی چون «قیدار»، «من او» و «ارمیا».",
        },
        {
            "name": "گابریل گارسیا مارکز (Gabriel Garcia Marquez)",
            "biography": "نویسنده کلمبیایی برنده جایزه نوبل ادبیات و پیشگام سبک رئالیسم جادویی؛ نویسنده «صد سال تنهایی».",
        },
        {
            "name": "جورج اورول (George Orwell)",
            "biography": "نویسنده و روزنامه‌نگار بریتانیایی؛ خالق پادآرمان‌شهرهای ماندگار «۱۹۸۴» و شاهکار تمثیلی «قلعه حیوانات».",
        },
        {
            "name": "فئودور داستایفسکی (Fyodor Dostoevsky)",
            "biography": "غول ادبیات کلاسیک روسیه؛ کاوشگر ژرف‌ترین لایه‌های روان آدمی در رمان‌های «جنایت و مکافات» و «برادران کارامازوف».",
        },
        {
            "name": "آلبر کامو (Albert Camus)",
            "biography": "فیلسوف، روزنامه‌نگار و نویسنده فرانسوی برنده نوبل؛ بیان‌کننده فلسفه اگزیستانسیالیسم و ابسوردیسم در «بیگانه» و «طاعون».",
        },
        {
            "name": "فرانتس کافکا (Franz Kafka)",
            "biography": "نویسنده آلمانی‌زبان اهل پراگ؛ به تصویر کشنده تنهایی و کابوس‌های دیوان‌سالارانه در داستان‌های کوتاهی چون «مسخ».",
        },
        {
            "name": "آنتوان دو سنت‌اگزوپری (Antoine de Saint-Exupery)",
            "biography": "خلبان و نویسنده فرانسوی؛ خالق داستان فلسفی و شاعرانه «شازده کوچولو» پرترجمه‌ترین کتاب در جهان.",
        },
        {
            "name": "هاروکی موراکامی (Haruki Murakami)",
            "biography": "رمان‌نویس سرشناس ژاپنی؛ ترکیب‌کننده فرهنگ پاپ غربی با سنت‌های شرقی در آثاری چون «کافکا در کرانه».",
        },
        {
            "name": "اروین یالوم (Irvin D. Yalom)",
            "biography": "روان‌پزشک اگزیستانسیال و استاد دانشگاه استنفورد؛ پیشگام رمان‌های روان‌شناختی همچون «وقتی نیچه گریست».",
        },
        {
            "name": "یووال نوح هراری (Yuval Noah Harari)",
            "biography": "تاریخ‌دان و استاد دانشگاه عبری اورشلیم؛ مولف کتاب‌های جریان‌ساز جهانی همچون «انسان خردمند: تاریخ مختصر بشر».",
        },
        {
            "name": "استیون هاوکینگ (Stephen Hawking)",
            "biography": "فیزیکدان نظری و کیهان‌شناس نامدار؛ تبیین‌کننده اسرار سیاه‌چاله‌ها و سرآغاز کیهان در «تاریخچه زمان».",
        },
        {
            "name": "میچیو کاکو (Michio Kaku)",
            "biography": "فیزیکدان نامدار آمریکایی و مروج پرشور دانش کیهان‌شناسی؛ نویسنده «جهان‌های موازی» و «فیزیک ناممکن‌ها».",
        },
        {
            "name": "رابرت سی. مارتین (Robert C. Martin - Uncle Bob)",
            "biography": "مهندس برجسته نرم‌افزار و بنیان‌گذار مانیفست چابک؛ مولف کتاب‌های مرجع مهندسی چون «Clean Code» و «Clean Architecture».",
        },
        {
            "name": "اریک ریس (Eric Ries)",
            "biography": "کارآفرین سیلیکون ولی و پدیدآورنده متدولوژی استارتاپ ناب (The Lean Startup) که ساخت محصولات فناوری را دگرگون کرد.",
        },
        {
            "name": "پیتر تیل (Peter Thiel)",
            "biography": "سرمایه‌گذار افسانه‌ای فناوری و هم‌بنیان‌گذار پی‌پال و پالانتیر؛ نویسنده کتاب الهام‌بخش «از صفر به یک».",
        },
        {
            "name": "جیمز کلیر (James Clear)",
            "biography": "پژوهشگر عادات فردی و نویسنده کتاب پرفروش جهانی «عادت‌های اتمی» با تیراژ میلیونی در سراسر دنیا.",
        },
    ]

    # =========================================================================
    # 3. 50 Realistic Books (Authentic Titles, ISBNs, Descriptions, Images)
    # =========================================================================
    REAL_BOOKS = [
        # --- FICTION ---
        {
            "title": "بوف کور (The Blind Owl)",
            "author": "صادق هدایت (Sadegh Hedayat)",
            "publisher": "negah",
            "genre": "FICTION",
            "isbn": "9789643510015",
            "cover_image_url": "/images/pic1.jpg",
            "description": "شاهکار ادبیات مدرن ایران؛ رمانی سوررئالیستی و عمیق درباره تنهایی، عشق اثیری و لایه‌های پنهان روان آدمی.",
            "is_digital": True,
            "is_audio": True,
            "base_price": 550000,
        },
        {
            "title": "چشم‌هایش (Her Eyes)",
            "author": "بزرگ علوی (Bozorg Alavi)",
            "publisher": "negah",
            "genre": "FICTION",
            "isbn": "9789643510022",
            "cover_image_url": "/images/pic2.jpg",
            "description": "داستانی پرکشش و معماگونه از زندگی استاد ماکان، نقاش بزرگ معاصر و راز چشم‌های زنی به نام فرنگیس.",
            "is_digital": True,
            "is_audio": True,
            "base_price": 620000,
        },
        {
            "title": "سووشون (Savushun)",
            "author": "سیمین دانشور (Simin Daneshvar)",
            "publisher": "rozane",
            "genre": "FICTION",
            "isbn": "9789643510039",
            "cover_image_url": "/images/pic3.jpg",
            "description": "روایتی پرشور و حماسی از پایداری مردم فارس و زندگی زری و یوسف در شیراز اشغال‌شده در خلال جنگ جهانی دوم.",
            "is_digital": True,
            "is_audio": True,
            "base_price": 750000,
        },
        {
            "title": "کلیدر: جلدهای اول و دوم (Kelidar)",
            "author": "محمود دولت‌آبادی (Mahmoud Dowlatabadi)",
            "publisher": "cheshmeh",
            "genre": "FICTION",
            "isbn": "9789643510046",
            "cover_image_url": "/images/pic4.jpg",
            "description": "حماسه بی‌نظیر زندگی عشایر کرد خراسان و ماجرای گل‌محمد در کویر سوزان؛ طولانی‌ترین رمان فارسی با نثری باشکوه.",
            "is_digital": True,
            "is_audio": False,
            "base_price": 1250000,
        },
        {
            "title": "شازده احتجاب (Prince Ehtejab)",
            "author": "هوشنگ گلشیری (Houshang Golshiri)",
            "publisher": "cheshmeh",
            "genre": "FICTION",
            "isbn": "9789643510053",
            "cover_image_url": "/images/pic5.jpg",
            "description": "تصویر هنرمندانه زوال و سقوط خاندان اشرافی قاجار در شب پایانی زندگی آخرین شاهزاده مسلول.",
            "is_digital": True,
            "is_audio": True,
            "base_price": 480000,
        },
        {
            "title": "سمفونی مردگان (Symphony of the Dead)",
            "author": "عباس معروفی (Abbas Maroufi)",
            "publisher": "rozane",
            "genre": "FICTION",
            "isbn": "9789643510060",
            "cover_image_url": "/images/pic6.jpg",
            "description": "سمفونی تکان‌دهنده‌ای از حسادت برادرانه، تعصبات کور و سرنوشت غم‌انگیز آیدین، شاعری آزاده در سرمای اردبیل.",
            "is_digital": True,
            "is_audio": True,
            "base_price": 820000,
        },
        {
            "title": "چراغ‌ها را من خاموش می‌کنم (I'll Turn Off the Lights)",
            "author": "زویا پیرزاد (Zoya Pirzad)",
            "publisher": "ofogh",
            "genre": "FICTION",
            "isbn": "9789643510077",
            "cover_image_url": "/images/pic7.jpg",
            "description": "رمانی برنده جوایز متعدد پیرامون زندگی زنی به نام کلاریس در محله آرام بوارده آبادان در دهه چهل خورشیدی.",
            "is_digital": True,
            "is_audio": False,
            "base_price": 680000,
        },
        {
            "title": "یک عاشقانه آرام (A Quiet Romance)",
            "author": "نادر ابراهیمی (Nader Ebrahimi)",
            "publisher": "rozane",
            "genre": "FICTION",
            "isbn": "9789643510084",
            "cover_image_url": "/images/pic8.jpg",
            "description": "گفتگوهایی شاعرانه و عمیق درباره پاسداری از عشق، گریز از روزمرگی و تداوم مهر در گذر زمان.",
            "is_digital": True,
            "is_audio": True,
            "base_price": 590000,
        },
        {
            "title": "قیدار (Qeidar)",
            "author": "رضا امیرخانی (Reza Amirkhani)",
            "publisher": "ofogh",
            "genre": "FICTION",
            "isbn": "9789643510091",
            "cover_image_url": "/images/pic9.avif",
            "description": "روایتی دلنشین از مرام و فتوت پهلوانی در تهران دهه پنجاه، با قلمی آهنگین و فضایی سرشار از جوانمردی.",
            "is_digital": True,
            "is_audio": True,
            "base_price": 790000,
        },
        {
            "title": "جای خالی سلوچ (Missing Soluch)",
            "author": "محمود دولت‌آبادی (Mahmoud Dowlatabadi)",
            "publisher": "cheshmeh",
            "genre": "FICTION",
            "isbn": "9789643510107",
            "cover_image_url": "/images/pic10.avif",
            "description": "تصویری تکان‌دهنده از فقر و استقامت مرگان و فرزندانش پس از غیبت ناگهانی همسرش در روستایی کویری.",
            "is_digital": True,
            "is_audio": False,
            "base_price": 720000,
        },
        {
            "title": "صد سال تنهایی (One Hundred Years of Solitude)",
            "author": "گابریل گارسیا مارکز (Gabriel Garcia Marquez)",
            "publisher": "negah",
            "genre": "FICTION",
            "isbn": "9789643510114",
            "cover_image_url": "/images/pic11.jpg",
            "description": "شاهکار رئالیسم جادویی؛ سرگذشت هفت نسل از خاندان بوئندیا در ماکوندو با ترجمه‌ای درخشان و دل‌انگیز.",
            "is_digital": True,
            "is_audio": True,
            "base_price": 980000,
        },
        {
            "title": "جنایت و مکافات (Crime and Punishment)",
            "author": "فئودور داستایفسکی (Fyodor Dostoevsky)",
            "publisher": "cheshmeh",
            "genre": "FICTION",
            "isbn": "9789643510121",
            "cover_image_url": "/images/pic12.jpg",
            "description": "تحلیل روان‌شناختی راسکولنیکف، دانشجوی فقیری که به انگیزه اجرای عدالت دست به قتل می‌زند و با طوفان وجدان روبرو می‌شود.",
            "is_digital": True,
            "is_audio": True,
            "base_price": 1150000,
        },
        {
            "title": "بیگانه (The Stranger)",
            "author": "آلبر کامو (Albert Camus)",
            "publisher": "negah",
            "genre": "FICTION",
            "isbn": "9789643510138",
            "cover_image_url": "/images/pic13.jpg",
            "description": "داستان مورسو و مواجهه صادقانه او با جهان پوچ؛ روایتی فلسفی از بیگانگی انسان با نقاب‌های جامعه مدرن.",
            "is_digital": True,
            "is_audio": True,
            "base_price": 490000,
        },
        {
            "title": "مسخ (The Metamorphosis)",
            "author": "فرانتس کافکا (Franz Kafka)",
            "publisher": "negah",
            "genre": "FICTION",
            "isbn": "9789643510145",
            "cover_image_url": "/images/pic14.jpg",
            "description": "صبحگاهی که گرگور سامسا بیدار می‌شود و خود را دگرگون‌شده به حشره‌ای می‌بیند؛ نماد ازخودبیگانگی انسان معاصر.",
            "is_digital": True,
            "is_audio": True,
            "base_price": 450000,
        },
        {
            "title": "شازده کوچولو (The Little Prince)",
            "author": "آنتوان دو سنت‌اگزوپری (Antoine de Saint-Exupery)",
            "publisher": "ofogh",
            "genre": "FICTION",
            "isbn": "9789643510152",
            "cover_image_url": "/images/pic15.jpg",
            "description": "سفر الهام‌بخش پسربچه‌ای از اخترک ب۶۱۲ در جستجوی معنای واقعی دوستی، مسئولیت‌پذیری و اهلی کردن.",
            "is_digital": True,
            "is_audio": True,
            "base_price": 420000,
        },
        {
            "title": "کافکا در کرانه (Kafka on the Shore)",
            "author": "هاروکی موراکامی (Haruki Murakami)",
            "publisher": "cheshmeh",
            "genre": "FICTION",
            "isbn": "9789643510169",
            "cover_image_url": "/images/pic16.avif",
            "description": "رمانی مسحورکننده از گربه‌های سخنگو، باران زالو و مرزهای باریک میان رویا، واقعیت و افسانه‌های باستان.",
            "is_digital": True,
            "is_audio": False,
            "base_price": 950000,
        },
        {
            "title": "وقتی نیچه گریست (When Nietzsche Wept)",
            "author": "اروین یالوم (Irvin D. Yalom)",
            "publisher": "noon",
            "genre": "FICTION",
            "isbn": "9789643510176",
            "cover_image_url": "/images/pic17.jpg",
            "description": "دیدار فرضی نیچه فیلسوف و یوزف برویر پزشک در وین قرن نوزدهم؛ رمانی جذاب در قلمرو درمان اگزیستانسیال.",
            "is_digital": True,
            "is_audio": True,
            "base_price": 890000,
        },

        # --- SCI_FI ---
        {
            "title": "۱۹۸۴ (Nineteen Eighty-Four)",
            "author": "جورج اورول (George Orwell)",
            "publisher": "cheshmeh",
            "genre": "SCI_FI",
            "isbn": "9789643510183",
            "cover_image_url": "/images/pic18.jpg",
            "description": "پادآرمان‌شهر تکان‌دهنده‌ای تحت سلطه ناظر کبیر؛ هشداری تاریخی درباره نظارت همگانی و تحریف حقیقت.",
            "is_digital": True,
            "is_audio": True,
            "base_price": 720000,
        },
        {
            "title": "قلعه حیوانات (Animal Farm)",
            "author": "جورج اورول (George Orwell)",
            "publisher": "rozane",
            "genre": "SCI_FI",
            "isbn": "9789643510190",
            "cover_image_url": "/images/pic19.jpg",
            "description": "تمثیل طنزآمیز و گزنده اورول از مصادره انقلاب مزرعه توسط خوک‌ها و سرنوشت آزادیخواهی در برابر استبداد.",
            "is_digital": True,
            "is_audio": True,
            "base_price": 530000,
        },
        {
            "title": "بنیاد کهکشانی (Foundation)",
            "author": "آیزاک آسیموف (Isaac Asimov)",
            "publisher": "porteghal",
            "genre": "SCI_FI",
            "isbn": "9789643510206",
            "cover_image_url": "/images/pic20.jpg",
            "description": "حماسه بی‌بدیل کیهانی؛ هری سلدون با دانش روان‌تاریخی خود زوال تمدن کهکشان و مسیر بازسازی آن را رقم می‌زند.",
            "is_digital": True,
            "is_audio": True,
            "base_price": 850000,
        },
        {
            "title": "مریخی (The Martian)",
            "author": "اندی ویر (Andy Weir)",
            "publisher": "noon",
            "genre": "SCI_FI",
            "isbn": "9789643510213",
            "cover_image_url": "/images/pic21.jpg",
            "description": "داستان خارق‌العاده بقای فضانوردی تنها در خاک سرخ مریخ با تکیه بر علم مهندسی، ابتکار و شوخ‌طبعی بی‌نظیر.",
            "is_digital": True,
            "is_audio": False,
            "base_price": 780000,
        },
        {
            "title": "فارنهایت ۴۵۱ (Fahrenheit 451)",
            "author": "ری بردبری (Ray Bradbury)",
            "publisher": "cheshmeh",
            "genre": "SCI_FI",
            "isbn": "9789643510220",
            "cover_image_url": "/images/pic22.jpg",
            "description": "در جهانی که کتاب خواندن جرم است و آتشنشان‌ها کتاب‌ها را به آتش می‌کشند، آگاهی جرقه‌ای برای بیداری می‌شود.",
            "is_digital": True,
            "is_audio": True,
            "base_price": 640000,
        },
        {
            "title": "دنیای قشنگ نو (Brave New World)",
            "author": "آلدوس هاکسلی (Aldous Huxley)",
            "publisher": "rozane",
            "genre": "SCI_FI",
            "isbn": "9789643510237",
            "cover_image_url": "/images/pic23.jpg",
            "description": "آینده‌ای بدون رنج اما تهی از روح و اصالت انسانی؛ جایی که با داروی سوما و اصلاح ژنتیکی انسان‌ها مسخ شده‌اند.",
            "is_digital": True,
            "is_audio": True,
            "base_price": 690000,
        },
        {
            "title": "تل‌ماسه (Dune)",
            "author": "فرانک هربرت (Frank Herbert)",
            "publisher": "porteghal",
            "genre": "SCI_FI",
            "isbn": "9789643510244",
            "cover_image_url": "/images/pic24.jpg",
            "description": "بزرگ‌ترین اپرای فضایی تاریخ بر سر تسلط بر آراکیس؛ سیاره شن‌های بی‌پایان و خاستگاه ادویه نجات‌بخش کیهان.",
            "is_digital": True,
            "is_audio": True,
            "base_price": 1050000,
        },
        {
            "title": "راهنمای مسافران کهکشان (The Hitchhiker's Guide)",
            "author": "داگلاس آدامز (Douglas Adams)",
            "publisher": "cheshmeh",
            "genre": "SCI_FI",
            "isbn": "9789643510251",
            "cover_image_url": "/images/pic25.jpg",
            "description": "طنز علمی‌تخیلی کم‌نظیر پیرامون پایان ناگهانی زمین و گشت‌وگذار در کیهان همراه با حوله حمام و کتاب راهنما.",
            "is_digital": True,
            "is_audio": True,
            "base_price": 610000,
        },

        # --- HISTORY ---
        {
            "title": "تاریخ مشروطه ایران (Constitutional Revolution)",
            "author": "احمد کسروی (Ahmad Kasravi)",
            "publisher": "negah",
            "genre": "HISTORY",
            "isbn": "9789643510268",
            "cover_image_url": "/images/c1.jpg",
            "description": "مستندترین و معتبرترین اثر تاریخ معاصر پیرامون نهضت مشروطیت، دلاوری‌های ستارخان و باقرخان و تأسیس دارالشورای ملی.",
            "is_digital": True,
            "is_audio": False,
            "base_price": 1450000,
        },
        {
            "title": "انسان خردمند: تاریخ مختصر بشر (Sapiens)",
            "author": "یووال نوح هراری (Yuval Noah Harari)",
            "publisher": "noon",
            "genre": "HISTORY",
            "isbn": "9789643510275",
            "cover_image_url": "/images/c2.jpg",
            "description": "مروری هیجان‌انگیز بر سیر تکامل هومو ساپینس از دوران پارینه‌سنگی و انقلاب شناختی تا طلوع هوش مصنوعی.",
            "is_digital": True,
            "is_audio": True,
            "base_price": 1100000,
        },
        {
            "title": "دو قرن سکوت (Two Centuries of Silence)",
            "author": "عبدالحسین زرین‌کوب (Abdolhossein Zarrinkoob)",
            "publisher": "rozane",
            "genre": "HISTORY",
            "isbn": "9789643510282",
            "cover_image_url": "/images/c3.jpg",
            "description": "پژوهش کم‌نظیر استاد زرین‌کوب در تحولات سیاسی، مذهبی، اجتماعی و فرهنگی ایران در دویست سال نخست ورود اسلام.",
            "is_digital": True,
            "is_audio": True,
            "base_price": 860000,
        },
        {
            "title": "ایران باستان (Ancient Iran)",
            "author": "حسن پیرنیا (Hasan Pirnia)",
            "publisher": "negah",
            "genre": "HISTORY",
            "isbn": "9789643510299",
            "cover_image_url": "/images/c4.jpg",
            "description": "دایرةالمعارف ارزشمند و دست‌اول تاریخ ایران از دوره مادها و شاهنشاهی هخامنشی تا ظهور اشکانیان.",
            "is_digital": True,
            "is_audio": False,
            "base_price": 1600000,
        },
        {
            "title": "مشرق زمین: گهواره تمدن (The Story of Civilization)",
            "author": "ویل دورانت (Will Durant)",
            "publisher": "rozane",
            "genre": "HISTORY",
            "isbn": "9789643510305",
            "cover_image_url": "/images/ppic1.jpg",
            "description": "جلد اول از شاهکار تاریخ تمدن ویل دورانت؛ سفری به تمدن‌های کهن سومر، بابل، مصر، ایران باستان و هند.",
            "is_digital": True,
            "is_audio": False,
            "base_price": 1350000,
        },
        {
            "title": "کوروش کبیر: شهریار دادگستر (Cyrus the Great)",
            "author": "هارولد لمب (Harold Lamb)",
            "publisher": "negah",
            "genre": "HISTORY",
            "isbn": "9789643510312",
            "cover_image_url": "/images/ppic2.jpg",
            "description": "روایت تاریخی و خواندنی از شکل‌گیری نخستین امپراتوری حقوق‌مدار جهان با ترجمه فاخر فارسی.",
            "is_digital": True,
            "is_audio": True,
            "base_price": 790000,
        },

        # --- SCIENCE ---
        {
            "title": "تاریخچه زمان: از مهبانگ تا سیاه‌چاله‌ها (Brief History of Time)",
            "author": "استیون هاوکینگ (Stephen Hawking)",
            "publisher": "khili-sabz",
            "genre": "SCIENCE",
            "isbn": "9789643510329",
            "cover_image_url": "/images/ppic3.jpg",
            "description": "کاوش در رازهای فضا، زمان و آغاز کیهان با زبانی ساده و شیوا به قلم برجسته‌ترین فیزیکدان کیهان‌شناس.",
            "is_digital": True,
            "is_audio": True,
            "base_price": 820000,
        },
        {
            "title": "جهان‌های موازی (Parallel Worlds)",
            "author": "میچیو کاکو (Michio Kaku)",
            "publisher": "khili-sabz",
            "genre": "SCIENCE",
            "isbn": "9789643510336",
            "cover_image_url": "/images/ppic4.jpg",
            "description": "سفری شگفت‌انگیز به جهان‌های دیگر، فیزیک ریسمان، سیاه‌چاله‌ها و سرنوشت پایانی کائنات.",
            "is_digital": True,
            "is_audio": False,
            "base_price": 890000,
        },
        {
            "title": "ژن خودخواه (The Selfish Gene)",
            "author": "ریچارد داوکینز (Richard Dawkins)",
            "publisher": "rozane",
            "genre": "SCIENCE",
            "isbn": "9789643510343",
            "cover_image_url": "/images/ppic5.jpg",
            "description": "کتابی بنیادین در زیست‌شناسی تکاملی؛ نگاهی از زاویه دید ژن‌ها به رفتارهای جانوری، نوع‌دوستی و بقا.",
            "is_digital": True,
            "is_audio": False,
            "base_price": 960000,
        },
        {
            "title": "کیهان (Cosmos)",
            "author": "کارل ساگان (Carl Sagan)",
            "publisher": "khili-sabz",
            "genre": "SCIENCE",
            "isbn": "9789643510350",
            "cover_image_url": "/images/ppic6.jpg",
            "description": "قصیده حماسی کارل ساگان در ستایش علم، تاریخ ستاره‌شناسی و جستجوی حیات در کیهان بی‌پایان.",
            "is_digital": True,
            "is_audio": True,
            "base_price": 1180000,
        },
        {
            "title": "طرح بزرگ (The Grand Design)",
            "author": "استیون هاوکینگ (Stephen Hawking)",
            "publisher": "noon",
            "genre": "SCIENCE",
            "isbn": "9789643510367",
            "cover_image_url": "/images/ppic7.jpg",
            "description": "تبیین قوانین بنیادین فیزیک کوانتوم و نظریه ام (M-Theory) در پاسخ به معمای چگونگی پیدایش جهان.",
            "is_digital": True,
            "is_audio": False,
            "base_price": 750000,
        },

        # --- TECH ---
        {
            "title": "کد تمیز: راهنمای تولید نرم‌افزار حرفه‌ای (Clean Code)",
            "author": "رابرت سی. مارتین (Robert C. Martin - Uncle Bob)",
            "publisher": "nasle-no",
            "genre": "TECH",
            "isbn": "9789643510374",
            "cover_image_url": "/images/ppic8.jpg",
            "description": "کتاب مرجع تمام مهندسان نرم‌افزار؛ اصول بازآفرینی کد، استانداردهای متغیرها و توابع، و اصول SOLID در عمل.",
            "is_digital": True,
            "is_audio": False,
            "base_price": 1450000,
        },
        {
            "title": "معماری تمیز: راهنمای ساخت نرم‌افزار پایدار (Clean Architecture)",
            "author": "رابرت سی. مارتین (Robert C. Martin - Uncle Bob)",
            "publisher": "nasle-no",
            "genre": "TECH",
            "isbn": "9789643510381",
            "cover_image_url": "/images/ppic9.jpg",
            "description": "قوانین تفکیک هسته منطق برنامه از فریم‌ورک‌ها و پایگاه‌های داده؛ معمار نرم‌افزار حرفه‌ای شدن.",
            "is_digital": True,
            "is_audio": False,
            "base_price": 1550000,
        },
        {
            "title": "طراحی سیستم‌های داده‌محور (Designing Data-Intensive Apps)",
            "author": "مارتین کلپمن (Martin Kleppmann)",
            "publisher": "nasle-no",
            "genre": "TECH",
            "isbn": "9789643510398",
            "cover_image_url": "/images/ppic10.jpg",
            "description": "انجیل مهندسی بک‌اند؛ بررسی عمیق مقیاس‌پذیری دیتابیس‌ها، صف‌های پیام، تراکنش‌های توزیع‌شده و همگام‌سازی داده‌ها.",
            "is_digital": True,
            "is_audio": False,
            "base_price": 2200000,
        },
        {
            "title": "پایتون پیشرفته و روان (Fluent Python)",
            "author": "لوسیانو رامالو (Luciano Ramalho)",
            "publisher": "khili-sabz",
            "genre": "TECH",
            "isbn": "9789643510404",
            "cover_image_url": "/images/ppic11.jpg",
            "description": "تسلط بر ویژگی‌های اصیل پایتون ۳، الگوهای برنامه‌نویسی غیرهمزمان (Asyncio)، دکوراتورها و جنراتورها.",
            "is_digital": True,
            "is_audio": False,
            "base_price": 1850000,
        },
        {
            "title": "توسعه وب حرفه‌ای با جنگو (Mastering Django)",
            "author": "نایجل جورج (Nigel George)",
            "publisher": "nasle-no",
            "genre": "TECH",
            "isbn": "9789643510411",
            "cover_image_url": "/images/ppic12.jpg",
            "description": "آموزش گام‌به‌گام پیاده‌سازی بک‌اند مدرن، امنیت، احراز هویت JWT و اتصال به پایگاه‌های داده رابطه‌ای.",
            "is_digital": True,
            "is_audio": False,
            "base_price": 1650000,
        },
        {
            "title": "مهندسی لینوکس و شبکه‌های سرور (Practical Linux)",
            "author": "ایوی نمث (Evi Nemeth)",
            "publisher": "khili-sabz",
            "genre": "TECH",
            "isbn": "9789643510428",
            "cover_image_url": "/images/ppic13.jpg",
            "description": "راهنمای عملی مدیریت سرور، خط فرمان Bash، مدیریت حافظه، کانفیگ شبکه و امنیت سیستم‌عامل‌های سرور.",
            "is_digital": True,
            "is_audio": False,
            "base_price": 1750000,
        },

        # --- BUSINESS ---
        {
            "title": "استارتاپ ناب (The Lean Startup)",
            "author": "اریک ریس (Eric Ries)",
            "publisher": "noon",
            "genre": "BUSINESS",
            "isbn": "9789643510435",
            "cover_image_url": "/images/ppic14.jpg",
            "description": "رویکرد دگرگون‌کننده ساخت سریع MVP، ارزیابی بازار با بازخورد مشتری و پرهیز از اتلاف سرمایه در کارآفرینی.",
            "is_digital": True,
            "is_audio": True,
            "base_price": 920000,
        },
        {
            "title": "از صفر به یک: خلق آینده در دنیای استارتاپ‌ها (Zero to One)",
            "author": "پیتر تیل (Peter Thiel)",
            "publisher": "nasle-no",
            "genre": "BUSINESS",
            "isbn": "9789643510442",
            "cover_image_url": "/images/pic1.jpg",
            "description": "چگونه به جای رقابت کورکورانه و کپی‌برداری از دیگران، انحصار نوآورانه بسازیم و جهان را ارتقا دهیم.",
            "is_digital": True,
            "is_audio": True,
            "base_price": 890000,
        },
        {
            "title": "بازنگری در کسب‌وکار (Rework)",
            "author": "اریک ریس (Eric Ries)",
            "publisher": "noon",
            "genre": "BUSINESS",
            "isbn": "9789643510459",
            "cover_image_url": "/images/pic2.jpg",
            "description": "دیدگاهی ضدکلیشه و کارآمد درباره سادگی کار، حذف جلسات طولانی و چابکی در راه‌اندازی شرکت‌های فناوری.",
            "is_digital": True,
            "is_audio": True,
            "base_price": 750000,
        },
        {
            "title": "عادت‌های اتمی (Atomic Habits)",
            "author": "جیمز کلیر (James Clear)",
            "publisher": "porteghal",
            "genre": "BUSINESS",
            "isbn": "9789643510466",
            "cover_image_url": "/images/pic3.jpg",
            "description": "راهنمایی عملی و علمی برای ایجاد تغییرات کوچک روزانه که نتایجی شگفت‌انگیز در بهره‌وری و زندگی خلق می‌کنند.",
            "is_digital": True,
            "is_audio": True,
            "base_price": 950000,
        },
        {
            "title": "هنر شفاف اندیشیدن (The Art of Thinking Clearly)",
            "author": "اروین یالوم (Irvin D. Yalom)",
            "publisher": "cheshmeh",
            "genre": "BUSINESS",
            "isbn": "9789643510473",
            "cover_image_url": "/images/pic4.jpg",
            "description": "شناخت خطاهای شناختی ذهن در تصمیم‌گیری‌های مالی، مدیریتی و روابط انسانی و راه‌های دوری از فریب‌های روانی.",
            "is_digital": True,
            "is_audio": True,
            "base_price": 880000,
        },
        {
            "title": "کفش‌باز: خاطرات بنیان‌گذار نایکی (Shoe Dog)",
            "author": "پیتر تیل (Peter Thiel)",
            "publisher": "noon",
            "genre": "BUSINESS",
            "isbn": "9789643510480",
            "cover_image_url": "/images/pic5.jpg",
            "description": "خاطرات خواندنی فیل نایت از سفر جسورانه ساخت برند جهانی نایکی با دستان خالی و باوری تسلیم‌ناپذیر.",
            "is_digital": True,
            "is_audio": True,
            "base_price": 1050000,
        },
        {
            "title": "رهبران آخر غذا می‌خورند (Leaders Eat Last)",
            "author": "اریک ریس (Eric Ries)",
            "publisher": "nasle-no",
            "genre": "BUSINESS",
            "isbn": "9789643510497",
            "cover_image_url": "/images/pic6.jpg",
            "description": "چرا برخی سازمان‌ها در بحران‌ها یکپارچه می‌مانند؟ اهمیت دایره امنیت و اعتماد متقابل در مدیریت تیم‌ها.",
            "is_digital": True,
            "is_audio": True,
            "base_price": 820000,
        },
        {
            "title": "ارمیا (Ermia)",
            "author": "رضا امیرخانی (Reza Amirkhani)",
            "publisher": "ofogh",
            "genre": "FICTION",
            "isbn": "9789643510503",
            "cover_image_url": "/images/pic7.jpg",
            "description": "داستان سلوک درونی جوانی دانشجو در دوران دفاع مقدس و چالش‌های بازگشت او به جامعه پایتخت.",
            "is_digital": True,
            "is_audio": True,
            "base_price": 760000,
        },
    ]

    # =========================================================================
    # 4. Command Execution Pipeline
    # =========================================================================

    @transaction.atomic
    def handle(self, *args, **options):
        random.seed(137)

        self.users = {}
        self.authors = {}
        self.publishers = {}
        self.books = {}
        self.prices = {}

        self.stdout.write(self.style.NOTICE("=== Realistic Bookstore Catalog Generator ==="))

        # Step 1: Purge all existing books, formats, authors, publishers, orders, proposals
        self.purge_existing_catalog_data()

        # Step 2: Ensure demo users, addresses, wallets exist
        self.ensure_users_and_wallets()

        # Step 3: Ensure subscription plans & discounts exist
        self.ensure_pricing_plans_and_discounts()

        # Step 4: Populate publishers & memberships
        self.create_publishers()

        # Step 5: Populate authors
        self.create_authors()

        # Step 6: Populate realistic books
        self.create_books()

        # Step 7: Create book formats & IRR prices
        self.create_formats_and_prices()

        # Step 8: Create publisher proposals & moderation workflow
        self.create_publisher_proposals()

        # Step 9: Create realistic orders, wishlists, carts & digital licenses
        self.create_customer_activity()

        self.print_summary()

    # =========================================================================
    # Step 1: Purge existing catalog data
    # =========================================================================
    def purge_existing_catalog_data(self):
        self.stdout.write("Deleting existing books, formats, authors, publishers, proposals, and related orders...")

        # Delete proposals and proposal details
        BookDeleteProposal.objects.all().delete()
        BookUpdateProposal.objects.all().delete()
        BookCreateProposal.objects.all().delete()
        AuthorUpdateProposal.objects.all().delete()
        AuthorCreateProposal.objects.all().delete()
        PriceChangeProposal.objects.all().delete()
        Proposal.objects.all().delete()

        # Delete publisher memberships & publishers
        PublisherMembership.objects.all().delete()
        Publisher.objects.all().delete()

        # Delete orders, order items and licenses (to release ProtectedError)
        OrderItem.objects.all().delete()
        Order.objects.all().delete()
        License.objects.all().delete()

        # Delete cart items & wishlists
        CartItem.objects.all().delete()
        WishlistItem.objects.all().delete()

        # Delete prices, book formats, books and authors
        Price.objects.all().delete()
        BookFormat.objects.all().delete()
        Book.objects.all().delete()
        Author.objects.all().delete()

        self.stdout.write(self.style.SUCCESS("All old catalog and publisher data deleted successfully."))

    # =========================================================================
    # Step 2: Ensure users, addresses, wallets
    # =========================================================================
    def ensure_users_and_wallets(self):
        self.stdout.write("Ensuring demo users and wallets...")

        for username, full_name in self.DEMO_USERS:
            parts = full_name.split()
            first_name = parts[0]
            last_name = parts[1] if len(parts) > 1 else ""

            user, _ = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": f"{username}@demo.local",
                    "first_name": first_name,
                    "last_name": last_name,
                },
            )
            if not user.has_usable_password():
                user.set_password(self.PASSWORD)
                user.save()

            self.users[username] = user

            # Saved address
            if not Address.objects.filter(user=user).exists():
                Address.objects.create(
                    user=user,
                    title="Home",
                    recipient_name=full_name,
                    phone_number=f"0912{random.randint(1000000, 9999999)}",
                    country="Iran",
                    province="Tehran",
                    city="Tehran",
                    address_line=f"Valiasr Ave, Alley {random.randint(1, 100)}, No {random.randint(1, 50)}",
                    postal_code=f"1{random.randint(100000000, 999999999)}",
                    is_default=True,
                )

            # Wallet funding in IRR (10,000,000 to 50,000,000 IRR)
            initial_balance = Decimal(random.randint(100, 500) * 100000)
            wallet, _ = Wallet.objects.get_or_create(
                user=user,
                defaults={"balance": initial_balance},
            )
            if wallet.balance < Decimal("5000000"):
                wallet.balance = initial_balance
                wallet.save(update_fields=["balance"])

                WalletTransaction.objects.create(
                    wallet=wallet,
                    transaction_type=WalletTransaction.TransactionType.DEPOSIT,
                    amount=initial_balance,
                    balance_after=wallet.balance,
                    description="Demo account initial deposit",
                )

        self.user_list = list(self.users.values())
        self.stdout.write(self.style.SUCCESS(f"Active user base ready: {len(self.users)} demo users."))

    # =========================================================================
    # Step 3: Subscription Plans & Discounts
    # =========================================================================
    def ensure_pricing_plans_and_discounts(self):
        plans = [
            ("Reader", Decimal("490000"), 10, 1),
            ("Scholar", Decimal("990000"), 20, 2),
            ("Professional", Decimal("1990000"), 35, 3),
        ]
        for name, price, discount, tier in plans:
            if not SubscriptionPlan.objects.filter(name=name).exists():
                SubscriptionPlan.objects.create(
                    name=name,
                    price=price,
                    discount_percentage=discount,
                    tier=tier,
                    duration_days=30,
                    is_active=True,
                )

        # Coupons
        coupons = [
            ("WELCOME10", Decimal("10")),
            ("SUMMER20", Decimal("20")),
            ("VIP30", Decimal("30")),
        ]
        for code, val in coupons:
            discount = Discount.objects.filter(name=code).first()
            if not discount:
                discount = Discount.objects.create(
                    name=code,
                    discount_type=Discount.DiscountType.PERCENT,
                    value=val,
                    scope=Discount.Scope.STORE,
                    activation=Discount.Activation.COUPON,
                    genre="",
                    format="",
                    is_active=True,
                )
            if not DiscountCode.objects.filter(code=code).exists():
                DiscountCode.objects.create(
                    code=code,
                    discount=discount,
                    max_uses=1000,
                    is_active=True,
                )

        # Automatic promotions
        auto_discounts = [
            ("جشنواره تابستانه کتاب‌های داستانی", Discount.DiscountType.PERCENT, Decimal("15"), Discount.Scope.GENRE, "FICTION", ""),
            ("هفته فناوری و مهندسی نرم‌افزار", Discount.DiscountType.PERCENT, Decimal("20"), Discount.Scope.GENRE, "TECH", ""),
            ("تخفیف ویژه کتاب‌های صوتی آوانامه و ماه‌آوا", Discount.DiscountType.PERCENT, Decimal("10"), Discount.Scope.FORMAT, "", Discount.Format.AUDIO),
        ]
        for name, dtype, val, scope, genre, fmt in auto_discounts:
            if not Discount.objects.filter(name=name).exists():
                Discount.objects.create(
                    name=name,
                    discount_type=dtype,
                    value=val,
                    scope=scope,
                    genre=genre,
                    format=fmt,
                    activation=Discount.Activation.AUTOMATIC,
                    is_active=True,
                )

    # =========================================================================
    # Step 4: Publishers & Memberships
    # =========================================================================
    def create_publishers(self):
        self.stdout.write("Creating Iranian publishers...")

        for pub_data in self.REAL_PUBLISHERS:
            publisher = Publisher.objects.create(
                name=pub_data["name"],
                website=pub_data["website"],
                contact_email=pub_data["email"],
                description=pub_data["description"],
            )
            # Custom slug to match frontend mock keys
            publisher.slug = pub_data["slug"]
            publisher.save(update_fields=["slug"])

            self.publishers[pub_data["slug"]] = publisher

        # Distribute demo users across publishers
        users = self.user_list.copy()
        random.shuffle(users)
        roles = [
            PublisherMembership.Role.OWNER,
            PublisherMembership.Role.MANAGER,
            PublisherMembership.Role.EDITOR,
        ]

        for publisher in self.publishers.values():
            if not users:
                break
            assigned = users[:3]
            users = users[3:]

            for idx, u in enumerate(assigned):
                PublisherMembership.objects.create(
                    publisher=publisher,
                    user=u,
                    role=roles[idx % len(roles)],
                    is_active=True,
                )

        # Grant superusers OWNER role in the primary publisher ("ofogh")
        primary_publisher = self.publishers.get("ofogh")
        if primary_publisher:
            for su in User.objects.filter(is_superuser=True):
                if not PublisherMembership.objects.filter(user=su, publisher=primary_publisher).exists():
                    PublisherMembership.objects.create(
                        publisher=primary_publisher,
                        user=su,
                        role=PublisherMembership.Role.OWNER,
                        is_active=True,
                    )

        self.stdout.write(self.style.SUCCESS(f"Created {len(self.publishers)} publishers with memberships."))

    # =========================================================================
    # Step 5: Authors
    # =========================================================================
    def create_authors(self):
        self.stdout.write("Creating author profiles...")

        for auth_data in self.REAL_AUTHORS:
            author = Author.objects.create(
                name=auth_data["name"],
                biography=auth_data["biography"],
            )
            self.authors[author.name] = author

        self.stdout.write(self.style.SUCCESS(f"Created {len(self.authors)} author profiles."))

    # =========================================================================
    # Step 6: Realistic Books
    # =========================================================================
    def create_books(self):
        self.stdout.write("Creating authentic book catalog...")

        for idx, book_data in enumerate(self.REAL_BOOKS, start=1):
            author = self.authors.get(book_data["author"])
            if not author:
                # Fallback author lookup or create
                author = Author.objects.filter(name__icontains=book_data["author"].split()[0]).first()
                if not author:
                    author = list(self.authors.values())[0]

            # Generate URL-friendly slug
            base_slug = slugify(book_data["title"])
            if not base_slug or len(base_slug) < 3:
                base_slug = f"book-{idx}"
            slug = f"{base_slug}-{idx}"

            book = Book.objects.create(
                author=author,
                title=book_data["title"],
                slug=slug,
                isbn=book_data["isbn"],
                description=book_data["description"],
                genre=book_data["genre"],
                cover_image_url=book_data["cover_image_url"],
                is_digital=book_data["is_digital"],
                is_audio=book_data["is_audio"],
                digital_file_path="/k2.pdf" if book_data["is_digital"] else "",
                audio_file_path="/sample-audio.wav" if book_data["is_audio"] else "",
            )

            # Store extra metadata for subsequent steps
            book._assigned_publisher = book_data["publisher"]
            book._base_price = book_data["base_price"]

            self.books[book.isbn] = book

        self.book_list = list(self.books.values())
        self.stdout.write(self.style.SUCCESS(f"Created {len(self.books)} authentic books."))

    # =========================================================================
    # Step 7: Formats & IRR Pricing
    # =========================================================================
    def create_formats_and_prices(self):
        self.stdout.write("Creating book formats and price histories in IRR...")

        now = timezone.now()
        formats_count = 0
        prices_count = 0

        for book in self.book_list:
            base_price = Decimal(book._base_price)

            # 1. PHYSICAL format (all books have physical)
            phys_format, _ = BookFormat.objects.get_or_create(
                book=book,
                format_type=BookFormat.FormatType.PHYSICAL,
                defaults={"is_available": True},
            )
            formats_count += 1

            Price.objects.create(
                book=book,
                book_format=phys_format,
                value=base_price,
                min_price=Decimal(int(base_price * Decimal("0.5") / 5000) * 5000),
                effective_from=now - timezone.timedelta(days=random.randint(45, 120)),
            )
            prices_count += 1

            # 2. DIGITAL format (if is_digital)
            if book.is_digital:
                dig_format, _ = BookFormat.objects.get_or_create(
                    book=book,
                    format_type=BookFormat.FormatType.DIGITAL,
                    defaults={"is_available": True},
                )
                formats_count += 1

                # Digital is ~65% of physical price
                dig_price = Decimal(int(base_price * Decimal("0.65") / 5000) * 5000)
                Price.objects.create(
                    book=book,
                    book_format=dig_format,
                    value=dig_price,
                    min_price=Decimal(int(dig_price * Decimal("0.5") / 5000) * 5000),
                    effective_from=now - timezone.timedelta(days=random.randint(45, 120)),
                )
                prices_count += 1

            # 3. AUDIO format (if is_audio)
            if book.is_audio:
                aud_format, _ = BookFormat.objects.get_or_create(
                    book=book,
                    format_type=BookFormat.FormatType.AUDIO,
                    defaults={"is_available": True},
                )
                formats_count += 1

                # Audio is ~85% of physical price
                aud_price = Decimal(int(base_price * Decimal("0.85") / 5000) * 5000)
                Price.objects.create(
                    book=book,
                    book_format=aud_format,
                    value=aud_price,
                    min_price=Decimal(int(aud_price * Decimal("0.5") / 5000) * 5000),
                    effective_from=now - timezone.timedelta(days=random.randint(45, 120)),
                )
                prices_count += 1

            # Add historical expired price for ~30% of titles
            if random.random() < 0.30:
                old_price_val = Decimal(int(base_price * Decimal("0.85") / 5000) * 5000)
                Price.objects.create(
                    book=book,
                    book_format=phys_format,
                    value=old_price_val,
                    min_price=Decimal(int(old_price_val * Decimal("0.5") / 5000) * 5000),
                    effective_from=now - timezone.timedelta(days=365),
                    effective_until=now - timezone.timedelta(days=90),
                )
                prices_count += 1

        self.stdout.write(self.style.SUCCESS(f"Created {formats_count} formats and {prices_count} price entries."))

    # =========================================================================
    # Step 8: Publisher Proposals & Moderation Workflow
    # =========================================================================
    def create_publisher_proposals(self):
        self.stdout.write("Linking catalog books to publishers and generating proposals...")

        applied_count = 0
        active_memberships = list(PublisherMembership.objects.filter(is_active=True))

        for book in self.book_list:
            pub_slug = getattr(book, "_assigned_publisher", "ofogh")
            publisher = self.publishers.get(pub_slug) or list(self.publishers.values())[0]

            pub_members = [m for m in active_memberships if m.publisher_id == publisher.id]
            submitter = pub_members[0].user if pub_members else self.user_list[0]

            # 1. Historical APPLIED proposal linking each book to its publisher
            applied_proposal = Proposal.objects.create(
                title=f"انتشار کتاب: {book.title}",
                publisher=publisher,
                submitted_by=submitter,
                proposal_type=Proposal.ProposalType.BOOK_CREATE,
                status=Proposal.Status.APPLIED,
                submitted_at=timezone.now() - timezone.timedelta(days=random.randint(60, 180)),
                reviewed_at=timezone.now() - timezone.timedelta(days=random.randint(30, 59)),
                applied_at=timezone.now() - timezone.timedelta(days=random.randint(1, 29)),
            )

            BookCreateProposal.objects.create(
                proposal=applied_proposal,
                created_book=book,
                author=book.author,
                title=book.title,
                description=book.description,
                isbn=book.isbn,
                cover_image_url=book.cover_image_url,
                genre=book.genre,
                is_digital=book.is_digital,
                is_audio=book.is_audio,
                digital_file_path=book.digital_file_path,
                audio_file_path=book.audio_file_path,
            )
            applied_count += 1

        # 2. Active proposals for publisher panel interaction
        proposal_statuses = [
            Proposal.Status.PENDING,
            Proposal.Status.APPROVED,
            Proposal.Status.REJECTED,
            Proposal.Status.WITHDRAWN,
        ]

        # Book Update Proposals
        for book in random.sample(self.book_list, k=6):
            pub_slug = getattr(book, "_assigned_publisher", "ofogh")
            publisher = self.publishers.get(pub_slug) or list(self.publishers.values())[0]
            pub_members = [m for m in active_memberships if m.publisher_id == publisher.id]
            submitter = pub_members[0].user if pub_members else self.user_list[0]

            status = random.choice(proposal_statuses)
            prop = Proposal.objects.create(
                title=f"درخواست ویرایش اطلاعات کتاب: {book.title}",
                publisher=publisher,
                submitted_by=submitter,
                proposal_type=Proposal.ProposalType.BOOK_UPDATE,
                status=status,
                submitted_at=timezone.now() - timezone.timedelta(days=random.randint(2, 20)),
            )
            BookUpdateProposal.objects.create(
                proposal=prop,
                book=book,
                title=book.title,
                description=f"ویرایش و به‌روزرسانی متن معرفی: {book.description}",
                cover_image_url=book.cover_image_url,
                genre=book.genre,
                is_digital=book.is_digital,
                is_audio=book.is_audio,
                digital_file_path=book.digital_file_path,
                audio_file_path=book.audio_file_path,
            )

        # Price Change Proposals
        for book in random.sample(self.book_list, k=6):
            pub_slug = getattr(book, "_assigned_publisher", "ofogh")
            publisher = self.publishers.get(pub_slug) or list(self.publishers.values())[0]
            pub_members = [m for m in active_memberships if m.publisher_id == publisher.id]
            submitter = pub_members[0].user if pub_members else self.user_list[0]

            phys_format = book.formats.filter(format_type=BookFormat.FormatType.PHYSICAL).first()
            current_p = phys_format.prices.first() if phys_format else None
            curr_val = current_p.value if current_p else Decimal(book._base_price)
            new_val = Decimal(int(curr_val * Decimal("1.15") / 5000) * 5000)

            prop = Proposal.objects.create(
                title=f"تغییر قیمت کتاب: {book.title}",
                publisher=publisher,
                submitted_by=submitter,
                proposal_type=Proposal.ProposalType.PRICE_CHANGE,
                status=random.choice(proposal_statuses),
                submitted_at=timezone.now() - timezone.timedelta(days=random.randint(1, 15)),
            )
            PriceChangeProposal.objects.create(
                proposal=prop,
                book=book,
                value=new_val,
                min_price=Decimal(int(new_val * Decimal("0.5") / 5000) * 5000),
                reason="تعدیل سالیانه قیمت با توجه به تجدید چاپ و افزایش هزینه کاغذ.",
            )

        self.stdout.write(self.style.SUCCESS(f"Published {applied_count} applied catalog books and active moderation proposals."))

    # =========================================================================
    # Step 9: Customer Activity (Orders, Licenses, Wishlists, Carts)
    # =========================================================================
    def create_customer_activity(self):
        self.stdout.write("Generating realistic customer orders, digital licenses and carts...")

        active_purchasers = self.user_list[:12]
        orders_count = 0
        licenses_count = 0

        for user in active_purchasers:
            # 1. Clear cart
            cart, _ = Cart.objects.get_or_create(user=user)
            cart.items.all().delete()

            # 2. Pick 1 to 3 random books for this order
            order_books = random.sample(self.book_list, k=random.randint(1, 3))
            for b in order_books:
                formats = list(b.formats.all())
                if formats:
                    chosen_fmt = random.choice(formats)
                    CartItem.objects.create(
                        cart=cart,
                        book=b,
                        book_format=chosen_fmt,
                        quantity=1,
                    )

            # 3. Process Checkout via CheckoutService
            wallet = Wallet.objects.get(user=user)
            service = CheckoutService(user=user)
            snapshot = service._build_order_snapshot(cart=cart)

            # Ensure wallet has enough IRR balance
            if wallet.balance < snapshot.total_amount:
                topup = snapshot.total_amount - wallet.balance + Decimal("2000000")
                wallet.balance += topup
                wallet.save(update_fields=["balance"])

            saved_addr = Address.objects.filter(user=user, is_default=True).first()
            shipping_data = {
                "shipping_name": saved_addr.recipient_name if saved_addr else f"{user.first_name} {user.last_name}",
                "shipping_address_line1": saved_addr.address_line if saved_addr else "خیابان ولیعصر، پلاک ۴۲",
                "shipping_city": saved_addr.city if saved_addr else "Tehran",
                "shipping_country": "Iran",
            }

            order = service.checkout(cart=cart, shipping_data=shipping_data)
            orders_count += 1

            # Count generated licenses
            user_licenses = License.objects.filter(user=user, is_active=True).count()
            licenses_count += user_licenses

            # 4. Populate 1-2 items in cart for active browsing
            cart.items.all().delete()
            browsing_book = random.choice(self.book_list)
            b_format = browsing_book.formats.first()
            if b_format:
                CartItem.objects.create(cart=cart, book=browsing_book, book_format=b_format, quantity=1)

            # 5. Populate Wishlist
            wishlist_books = random.sample(self.book_list, k=random.randint(2, 4))
            for wb in wishlist_books:
                WishlistItem.objects.get_or_create(user=user, book=wb)

        self.stdout.write(self.style.SUCCESS(f"Created {orders_count} orders with active licenses and populated wishlists."))

    # =========================================================================
    # Summary
    # =========================================================================
    def print_summary(self):
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("=================================================="))
        self.stdout.write(self.style.SUCCESS("  REALISTIC CATALOG POPULATED SUCCESSFULLY!"))
        self.stdout.write(self.style.SUCCESS("=================================================="))
        self.stdout.write(f"  • Publishers:       {Publisher.objects.count()}")
        self.stdout.write(f"  • Authors:          {Author.objects.count()}")
        self.stdout.write(f"  • Books:            {Book.objects.count()}")
        self.stdout.write(f"  • Formats:          {BookFormat.objects.count()}")
        self.stdout.write(f"  • Active Prices:    {Price.objects.count()}")
        self.stdout.write(f"  • Proposals:        {Proposal.objects.count()}")
        self.stdout.write(f"  • Orders:           {Order.objects.count()}")
        self.stdout.write(f"  • Digital Licenses: {License.objects.count()}")
        self.stdout.write(f"  • Wishlist Items:   {WishlistItem.objects.count()}")
        self.stdout.write(self.style.SUCCESS("=================================================="))
