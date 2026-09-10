"""
Publisher Seeder: Authentic Iranian & International Publishing Houses.
Creates publishers, their memberships, and associated manager accounts.
"""
from django.contrib.auth import get_user_model
from publishing.models import Publisher, PublisherMembership

User = get_user_model()

REAL_PUBLISHERS = [
    {
        "slug": "cheshmeh",
        "name": "نشر چشمه (Cheshmeh Publications)",
        "website": "https://cheshmeh.ir",
        "email": "info@cheshmeh.ir",
        "description": "از پرمخاطب‌ترین ناشران کشور در حوزه‌های ادبیات داستانی معاصر، فلسفه، علوم اجتماعی، سینما و هنر.",
        "manager_username": "pub_cheshmeh",
        "manager_name": "مدیر نشر چشمه",
    },
    {
        "slug": "negah",
        "name": "انتشارات نگاه (Negah Publications)",
        "website": "https://negahpub.com",
        "email": "info@negahpub.com",
        "description": "بیش از نیم قرن سابقه درخشان در انتشار شاهکارهای کلاسیک ادبیات فارسی، مجموعه اشعار ماندگار و رمان‌های اصیل.",
        "manager_username": "pub_negah",
        "manager_name": "مدیر انتشارات نگاه",
    },
    {
        "slug": "ofogh",
        "name": "نشر افق (Ofogh Publications)",
        "website": "https://ofoqbooks.com",
        "email": "info@ofoqbooks.com",
        "description": "از معتبرترین ناشران ایران در زمینه رمان‌های معاصر جهان، شاهکارهای ترجمه، ادبیات کلاسیک و ادبیات اندیشه‌ورز.",
        "manager_username": "pub_ofogh",
        "manager_name": "مدیر نشر افق",
    },
    {
        "slug": "avanameh",
        "name": "آوانامه (Avanameh Audiobooks)",
        "website": "https://avanameh.com",
        "email": "contact@avanameh.com",
        "description": "پیشگام تولید کتاب‌های صوتی با استانداردهای جهانی در ایران، با صدای برجسته‌ترین گویندگان، دوبلورها و بازیگران تئاتر.",
        "manager_username": "pub_avanameh",
        "manager_name": "مدیر استودیو آوانامه",
    },
    {
        "slug": "nasle-no",
        "name": "انتشارات نسل نو اندیش (Nasle Noandish)",
        "website": "https://naslenoandish.com",
        "email": "info@naslenoandish.com",
        "description": "تخصصی‌ترین ناشر کتاب‌های روانشناسی کاربردی، موفقیت مالی، مدیریت چابک، استارتاپ‌ها و مهندسی نرم‌افزار.",
        "manager_username": "pub_nasleno",
        "manager_name": "مدیر نسل نواندیش",
    },
    {
        "slug": "porteghal",
        "name": "انتشارات پرتقال (Porteghal)",
        "website": "https://porteghal.com",
        "email": "info@porteghal.com",
        "description": "ناشر برتر کتاب‌های هیجان‌انگیز، علمی‌تخیلی، ماجراجویی و فانتزی‌های جذاب و پرفروش بین‌المللی.",
        "manager_username": "pub_porteghal",
        "manager_name": "مدیر انتشارات پرتقال",
    },
    {
        "slug": "rozaneh",
        "name": "نشر روزنه (Rozaneh Publications)",
        "website": "https://rowzanehnashr.com",
        "email": "info@rowzanehnashr.com",
        "description": "انتشار کتاب‌های مرجع در حوزه فلسفه، تاریخ تمدن، جامعه‌شناسی، علوم سیاسی و ادبیات فاخر جهانی.",
        "manager_username": "pub_rozaneh",
        "manager_name": "مدیر نشر روزنه",
    },
    {
        "slug": "mah-ava",
        "name": "ماه‌آوا (Mah Ava Audiobooks)",
        "website": "https://mahava.ir",
        "email": "info@mahava.ir",
        "description": "موسسه تخصصی تولید و نشر کتاب‌های گویای ادبیات معاصر، نمایشنامه‌های صوتی و داستان‌های کوتاه شنیدنی.",
        "manager_username": "pub_mahava",
        "manager_name": "مدیر موسسه ماه‌آوا",
    },
]

PASSWORD = "demo12345"

def seed_publishers(stdout=None):
    created_publishers = {}
    for pub_data in REAL_PUBLISHERS:
        pub, _ = Publisher.objects.update_or_create(
            slug=pub_data["slug"],
            defaults={
                "name": pub_data["name"],
                "website": pub_data["website"],
                "contact_email": pub_data["email"],
                "description": pub_data["description"],
                "is_active": True,
            },
        )
        created_publishers[pub_data["slug"]] = pub

        # Create or update manager user
        username = pub_data["manager_username"]
        email = pub_data["email"]
        user = User.objects.filter(username=username).first()
        if not user:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=PASSWORD,
                first_name=pub_data["manager_name"],
            )
        else:
            user.set_password(PASSWORD)
            user.first_name = pub_data["manager_name"]
            user.save()

        # Link publisher membership
        PublisherMembership.objects.update_or_create(
            user=user,
            defaults={
                "publisher": pub,
                "role": PublisherMembership.Role.OWNER,
                "is_active": True,
            },
        )

    if stdout:
        stdout.write(f"  ✓ Seeded {len(created_publishers)} publishers and membership owners.")

    return created_publishers
