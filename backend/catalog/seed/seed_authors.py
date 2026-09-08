"""
Author Seeder: World and Iranian Literary Figures.
Conforms to S1&2_catalog_model_changes.md and S3_dataset_creation_guide.md.
"""
from catalog.models import Author

REAL_AUTHORS = [
    {
        "name": "George Orwell",
        "normalized_name": "george orwell",
        "primary_language": "en",
        "biography": (
            "English novelist, essayist, journalist, and critic whose work is marked by lucid prose, "
            "biting awareness of social injustice, passionate opposition to totalitarianism, and outspoken "
            "support for democratic socialism. His iconic novels 1984 and Animal Farm remain global benchmarks."
        ),
        "avatar_url": "/images/ppic7.jpg",
    },
    {
        "name": "Aldous Huxley",
        "normalized_name": "aldous huxley",
        "primary_language": "en",
        "biography": (
            "English writer and philosopher who authored nearly fifty books including novels, non-fiction, "
            "essays, and poetry. Best known for his dystopian masterwork examining sensory conditioning, "
            "consumerist pacification, and technocratic state control in Brave New World."
        ),
        "avatar_url": "/images/ppic8.jpg",
    },
    {
        "name": "Philip K. Dick",
        "normalized_name": "philip k. dick",
        "primary_language": "en",
        "biography": (
            "American science fiction writer renowned for exploring philosophical, social, and metaphysical "
            "themes, including altered states of consciousness, artificial intelligence, authoritarian corporations, "
            "and the fragile nature of perceived reality."
        ),
        "avatar_url": "/images/ppic9.jpg",
    },
    {
        "name": "Frank Herbert",
        "normalized_name": "frank herbert",
        "primary_language": "en",
        "biography": (
            "American science fiction author critically acclaimed for his epic Dune saga, an intricate "
            "multi-layered masterpiece intertwining planetary ecology, feudal galactic politics, messianic religion, "
            "resource economics, and human survival."
        ),
        "avatar_url": "/images/ppic10.jpg",
    },
    {
        "name": "Robert C. Martin",
        "normalized_name": "robert c. martin",
        "primary_language": "en",
        "biography": (
            "Celebrated software engineer, co-author of the Agile Manifesto, and creator of the SOLID principles. "
            "Widely regarded worldwide as 'Uncle Bob', he is a leading evangelist for software craftsmanship, "
            "architectural discipline, automated testing, and code cleanliness."
        ),
        "avatar_url": "/images/ppic11.jpg",
    },
    {
        "name": "Eric Evans",
        "normalized_name": "eric evans",
        "primary_language": "en",
        "biography": (
            "Thought leader in software design and founder of Domain-Driven Design (DDD). Specializes in "
            "domain modeling, enterprise software architecture, bounded contexts, and bridging the mental gap "
            "between complex business domains and technical code."
        ),
        "avatar_url": "/images/ppic12.jpg",
    },
    {
        "name": "Yuval Noah Harari",
        "normalized_name": "yuval noah harari",
        "primary_language": "en",
        "biography": (
            "Israeli historian, philosopher, and professor in the Department of History at the Hebrew University "
            "of Jerusalem. Author of groundbreaking global bestsellers examining the deep cognitive evolution, "
            "agricultural revolutions, and technological dilemmas of humankind."
        ),
        "avatar_url": "/images/ppic13.jpg",
    },
    {
        "name": "James Clear",
        "normalized_name": "james clear",
        "primary_language": "en",
        "biography": (
            "Author, speaker, and researcher focusing on habits, decision-making, and continuous self-improvement. "
            "His work centers on how small, systematic atomic choices compound into transformative life, creative, "
            "and career outcomes."
        ),
        "avatar_url": "/images/ppic14.jpg",
    },
    {
        "name": "Albert Camus",
        "normalized_name": "albert camus",
        "primary_language": "en",
        "biography": (
            "French-Algerian philosopher, author, dramatist, and journalist who was awarded the Nobel Prize in "
            "Literature in 1957. Renowned for formulating the philosophy of the Absurd and exploring the human "
            "revolt against cosmic meaninglessness."
        ),
        "avatar_url": "/images/port1.png",
    },
    {
        "name": "Fyodor Dostoevsky",
        "normalized_name": "fyodor dostoevsky",
        "primary_language": "en",
        "biography": (
            "Titan of classical Russian literature whose psychological novels penetrate the deepest chambers of "
            "the human soul, examining moral culpability, redemption, faith, existential dread, and the limits of free will."
        ),
        "avatar_url": "/images/port2.jpg",
    },
    {
        "name": "صادق هدایت (Sadegh Hedayat)",
        "normalized_name": "sadegh hedayat",
        "primary_language": "fa",
        "biography": (
            "پیشگام داستان‌نویسی مدرن ایران و یکی از برجسته‌ترین ادیبان سده بیستم آسیا. خالق شاهکار جاودان «بوف کور» "
            "که ادبیات فارسی را وارد دوران مدرنیسم و کاوش‌های عمیق روانی و اگزیستانسیال ساخت."
        ),
        "avatar_url": "/images/ppic1.jpg",
    },
    {
        "name": "بزرگ علوی (Bozorg Alavi)",
        "normalized_name": "bozorg alavi",
        "primary_language": "fa",
        "biography": (
            "نویسنده، استاد برجسته زبان و ادبیات فارسی و فعال اجتماعی معاصر. خالق رمان عاشقانه و اجتماعی ماندگار "
            "«چشم‌هایش» و مجموعه داستان‌های ماندگار «چمدان» و «ورق‌پاره‌های زندان»."
        ),
        "avatar_url": "/images/ppic2.jpg",
    },
    {
        "name": "سیمین دانشور (Simin Daneshvar)",
        "normalized_name": "simin daneshvar",
        "primary_language": "fa",
        "biography": (
            "نخستین زن نویسنده نامدار رمان در تاریخ ادبیات نوین فارسی، مترجم برجسته و استاد دانشگاه تهران. "
            "رمان درخشان او «سووشون» از ماندگارترین، تاثیرگذارترین و پرفروش‌ترین آثار ادبیات معاصر ایران است."
        ),
        "avatar_url": "/images/ppic3.jpg",
    },
    {
        "name": "محمود دولت‌آبادی (Mahmoud Dowlatabadi)",
        "normalized_name": "mahmoud dowlatabadi",
        "primary_language": "fa",
        "biography": (
            "رمان‌نویس، نمایش‌نامه‌نویس و ادیب برجسته ایرانی. آفریننده رمان حماسی و ده جلدی «کلیدر» که به عنوان "
            "طولانی‌ترین رمان زبان فارسی شناخته می‌شود و شاهکار کم‌نظیر «جای خالی سلوچ»."
        ),
        "avatar_url": "/images/ppic4.jpg",
    },
    {
        "name": "عباس معروفی (Abbas Maroufi)",
        "normalized_name": "abbas maroufi",
        "primary_language": "fa",
        "biography": (
            "نویسنده، نمایش‌نامه‌نویس و روزنامه‌نگار نامدار معاصر و مدیر نشریه ادبی گردون. خالق شاهکار تراژیک "
            "«سمفونی مردگان» با الهام از سمفونی پنجم بتهوون و رمان ماندگار «سال بلوا»."
        ),
        "avatar_url": "/images/ppic5.jpg",
    },
    {
        "name": "هوشنگ گلشیری (Houshang Golshiri)",
        "normalized_name": "houshang golshiri",
        "primary_language": "fa",
        "biography": (
            "داستان‌نویس معاصر، منتقد ادبی و استاد بی‌بدیل تکنیک‌های پیشرفته روایت در ادبیات مدرن ایران. "
            "نویسنده اثر درخشان و چندلایه «شازده احتجاب» و بنیان‌گذار جلسات ادبی تاثیرگذار پنجشنبه‌ها."
        ),
        "avatar_url": "/images/ppic6.jpg",
    },
    {
        "name": "Daniel Kahneman",
        "normalized_name": "daniel kahneman",
        "primary_language": "en",
        "biography": (
            "Israeli-American psychologist and Nobel laureate in Economic Sciences, renowned for his pioneer work "
            "on the psychology of judgment, behavioral economics, heuristics, and dual-process cognitive theories."
        ),
        "avatar_url": "/images/ppic1.jpg",
    },
    {
        "name": "Viktor E. Frankl",
        "normalized_name": "viktor e. frankl",
        "primary_language": "en",
        "biography": (
            "Austrian neurologist, psychiatrist, Holocaust survivor, and founder of logotherapy, a form of psychotherapy "
            "grounded in humanity's primary motivational force: the persistent search for personal meaning."
        ),
        "avatar_url": "/images/ppic2.jpg",
    },
    {
        "name": "Marcus Aurelius",
        "normalized_name": "marcus aurelius",
        "primary_language": "en",
        "biography": (
            "Roman emperor from 161 to 180 AD and Stoic philosopher. His private reflective journal, known as Meditations, "
            "stands as one of the timeless masterpieces of ancient practical philosophy, duty, and emotional resilience."
        ),
        "avatar_url": "/images/ppic3.jpg",
    },
    {
        "name": "Peter Thiel",
        "normalized_name": "peter thiel",
        "primary_language": "en",
        "biography": (
            "Entrepreneur, venture capitalist, and co-founder of PayPal and Palantir Technologies. Author of Zero to One, "
            "investing in transformative technological monopolies that progress humanity from 0 to 1."
        ),
        "avatar_url": "/images/ppic4.jpg",
    },
    {
        "name": "Eric Ries",
        "normalized_name": "eric ries",
        "primary_language": "en",
        "biography": (
            "Silicon Valley entrepreneur and author of The Lean Startup, pioneering rapid experimentation, customer-validated "
            "learning, and agile iteration to build sustainable technology products."
        ),
        "avatar_url": "/images/ppic5.jpg",
    },
    {
        "name": "David Thomas & Andrew Hunt",
        "normalized_name": "david thomas & andrew hunt",
        "primary_language": "en",
        "biography": (
            "Pioneering software engineers and original co-authors of the Agile Manifesto. Authors of The Pragmatic Programmer, "
            "widely regarded as essential literature for professional software craft."
        ),
        "avatar_url": "/images/ppic7.jpg",
    },
    {
        "name": "William Gibson",
        "normalized_name": "william gibson",
        "primary_language": "en",
        "biography": (
            "American-Canadian speculative fiction author who pioneered the cyberpunk subgenre and famously coined the term "
            "'cyberspace' in his groundbreaking 1984 debut novel Neuromancer."
        ),
        "avatar_url": "/images/ppic8.jpg",
    },
    {
        "name": "Isaac Asimov",
        "normalized_name": "isaac asimov",
        "primary_language": "en",
        "biography": (
            "Visionary biochemist and one of the 'Big Three' science fiction masters. Creator of the epic Foundation series, "
            "the Three Laws of Robotics, and countless classic speculative works."
        ),
        "avatar_url": "/images/ppic9.jpg",
    },
    {
        "name": "Gabriel Garcia Marquez",
        "normalized_name": "gabriel garcia marquez",
        "primary_language": "en",
        "biography": (
            "Colombian novelist and Nobel laureate in Literature. Master of magical realism whose masterpiece One Hundred "
            "Years of Solitude chronicles the mythic rise and tragic fall of Macondo."
        ),
        "avatar_url": "/images/ppic10.jpg",
    },
    {
        "name": "Ray Bradbury",
        "normalized_name": "ray bradbury",
        "primary_language": "en",
        "biography": (
            "American author celebrated for his poetic speculative fiction, including Fahrenheit 451, The Martian Chronicles, "
            "and evocative explorations of censorship, wonder, and humanity."
        ),
        "avatar_url": "/images/ppic11.jpg",
    },
    {
        "name": "Franz Kafka",
        "normalized_name": "franz kafka",
        "primary_language": "en",
        "biography": (
            "German-speaking Bohemian novelist renowned for nightmarish, bureaucratic parables examining existential anxiety, "
            "guilt, and bizarre transformations in The Metamorphosis and The Trial."
        ),
        "avatar_url": "/images/ppic12.jpg",
    },
    {
        "name": "Niccolo Machiavelli",
        "normalized_name": "niccolo machiavelli",
        "primary_language": "en",
        "biography": (
            "Florentine diplomat, philosopher, and political theorist of the Renaissance. Author of The Prince, which established "
            "modern political realism by examining statecraft through pragmatic power rather than moral idealism."
        ),
        "avatar_url": "/images/ppic13.jpg",
    },
    {
        "name": "Stephen Hawking",
        "normalized_name": "stephen hawking",
        "primary_language": "en",
        "biography": (
            "Theoretical physicist and cosmologist whose work on black holes, quantum cosmology, and A Brief History of Time "
            "captivated millions, demystifying the origins and fundamental structure of the universe."
        ),
        "avatar_url": "/images/ppic14.jpg",
    },
]

def seed_authors(stdout=None):
    created_authors = {}
    for a_data in REAL_AUTHORS:
        author, _ = Author.objects.update_or_create(
            normalized_name=a_data["normalized_name"],
            defaults={
                "name": a_data["name"],
                "primary_language": a_data["primary_language"],
                "biography": a_data["biography"],
                "avatar_url": a_data["avatar_url"],
            },
        )
        created_authors[a_data["normalized_name"]] = author

    if stdout:
        stdout.write(f"  ✓ Seeded {len(created_authors)} authors with normalized names and portraits.")

    return created_authors
