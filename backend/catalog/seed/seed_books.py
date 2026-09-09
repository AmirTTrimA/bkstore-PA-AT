"""
Book Catalog Seeder: 42 Curated Literary and Scientific Works.
Conforms to S1&2_catalog_model_changes.md and S3_dataset_creation_guide.md.
"""
from decimal import Decimal
from django.utils import timezone
from django.utils.text import slugify
from catalog.models import Book, BookFormat
from pricing.models import Price
from publishing.models import BookCreateProposal, Proposal

CURATED_BOOKS = [
    # --- DYSTOPIAN & SPECULATIVE FICTION (ENGLISH) ---
    {
        "title": "1984",
        "author_normalized": "george orwell",
        "publisher_slug": "ofogh",
        "genre": "SCI_FI",
        "genres": ["sci-fi", "fiction"],
        "tags": ["dystopia", "totalitarianism", "surveillance", "censorship", "propaganda"],
        "isbn": "9780451524935",
        "language": "en",
        "publication_year": 1949,
        "edition": "Signet Classic Edition",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg",
        "description": (
            "Winston Smith lives in a harrowing society dominated by the Party and overseen by Big Brother, "
            "where independent thought is outlawed as thoughtcrime. Working at the Ministry of Truth, his daily "
            "routine involves systematically rewriting historical archives to maintain the illusion of infallible "
            "governmental correctness. As disillusionment festers within him, Winston embarks on a perilous "
            "forbidden romance with Julia and secretly seeks affiliation with the rumored underground resistance. "
            "Orwell's prophetic masterpiece remains the quintessential examination of state surveillance, "
            "ideological manipulation, and the erasure of individual human memory."
        ),
        "is_digital": True,
        "is_audio": True,
        "base_price": 680000,
    },
    {
        "title": "Animal Farm",
        "author_normalized": "george orwell",
        "publisher_slug": "ofogh",
        "genre": "FICTION",
        "genres": ["fiction"],
        "tags": ["totalitarianism", "propaganda", "revolution", "class struggle", "morality"],
        "isbn": "9780451526342",
        "language": "en",
        "publication_year": 1945,
        "edition": "75th Anniversary Edition",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780451526342-L.jpg",
        "description": (
            "When the mistreated livestock of Manor Farm overthrow their neglectful human master Mr. Jones, they "
            "establish an egalitarian collective dedicated to the principles of Animalism, proclaiming that all animals "
            "are created equal. However, the cunning and power-hungry pigs, led by the ruthless Napoleon, gradually "
            "subvert democratic promises, transforming into an authoritarian governing elite far more brutal than their "
            "former human oppressors. Orwell's timeless allegorical fable delivers an incisive critique of political "
            "corruption, revolutionary betrayals, and the tragic cycle of totalitarian rule."
        ),
        "is_digital": True,
        "is_audio": True,
        "base_price": 420000,
    },
    {
        "title": "Homage to Catalonia",
        "author_normalized": "george orwell",
        "publisher_slug": "rozaneh",
        "genre": "HISTORY",
        "genres": ["history"],
        "tags": ["revolution", "totalitarianism", "class struggle", "propaganda"],
        "isbn": "9780156421171",
        "language": "en",
        "publication_year": 1938,
        "edition": "Harvest Book Edition",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780156421171-L.jpg",
        "description": (
            "In December 1936, George Orwell traveled to Spain intending to report on the Spanish Civil War, but swiftly "
            "enlisted in the militia of the anti-Stalinist Workers' Party of Marxist Unification (POUM) to battle Fascist "
            "insurgent forces. What unfolds is an extraordinary, unvarnished eyewitness account of wartime courage, "
            "fraternal solidarity, and subsequent political betrayal when communist factions orchestrated ruthless "
            "crackdowns against fellow leftists. Orwell recounts his military experiences on the icy Aragon front, "
            "street fighting in Barcelona, and narrow escape from sectarian purges."
        ),
        "is_digital": True,
        "is_audio": False,
        "base_price": 520000,
    },
    {
        "title": "Brave New World",
        "author_normalized": "aldous huxley",
        "publisher_slug": "ofogh",
        "genre": "SCI_FI",
        "genres": ["sci-fi", "fiction"],
        "tags": ["dystopia", "surveillance", "human nature", "identity", "free will"],
        "isbn": "9780060850524",
        "language": "en",
        "publication_year": 1932,
        "edition": "Harper Perennial Modern Classics",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780060850524-L.jpg",
        "description": (
            "Set in a technologically sophisticated future realm known as the World State, citizens are genetically "
            "engineered into predetermined rigid social castes, chemically conditioned from conception, and perpetually "
            "pacified through compulsory consumption and the euphoric sedative drug soma. Bernard Marx and the outcast "
            "John the Savage find themselves deeply alienated from this sterile hedonistic paradise, craving genuine "
            "emotional depth, artistic passion, and spiritual sovereignty. Huxley's cautionary vision poses enduring "
            "questions regarding whether technological perfection is worth the absolute sacrifice of human freedom."
        ),
        "is_digital": True,
        "is_audio": True,
        "base_price": 720000,
    },
    {
        "title": "The Doors of Perception",
        "author_normalized": "aldous huxley",
        "publisher_slug": "rozaneh",
        "genre": "PHILOSOPHY",
        "genres": ["philosophy", "psychology"],
        "tags": ["epistemology", "mysticism", "identity", "memory"],
        "isbn": "9780061729072",
        "language": "en",
        "publication_year": 1954,
        "edition": "Harper Perennial Edition",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780061729072-L.jpg",
        "description": (
            "In this philosophical treatise, Aldous Huxley documents his psychological and aesthetic reactions "
            "following a supervised clinical experiment with mescaline in 1953. Drawing upon William Blake's famous "
            "poetic aphorism, Huxley suggests that ordinary sensory perception is restricted by a biological reducing "
            "valve, shielding the human brain from an overwhelming torrent of Mind at Large. The essay investigates "
            "visual artistry, sacred contemplative traditions, and the profound metaphysical relationship between "
            "neurological constraints and transcendental spiritual consciousness."
        ),
        "is_digital": True,
        "is_audio": False,
        "base_price": 460000,
    },
    {
        "title": "Do Androids Dream of Electric Sheep?",
        "author_normalized": "philip k. dick",
        "publisher_slug": "porteghal",
        "genre": "SCI_FI",
        "genres": ["sci-fi"],
        "tags": ["cyberpunk", "artificial intelligence", "dystopia", "identity", "ethics"],
        "isbn": "9780345404473",
        "language": "en",
        "publication_year": 1968,
        "edition": "Del Rey Mass Market Edition",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780345404473-L.jpg",
        "description": (
            "Following a devastating global radioactive fallout, Earth has become a desolate wasteland where real "
            "biological animals are nearly extinct luxury symbols, and humans rely on synthetic electric substitutes. "
            "Bounty hunter Rick Deckard receives a dangerous assignment to retire six runaway Nexus-6 androids that "
            "escaped planetary colonies to pass as human beings in San Francisco. Armed with the empathy-testing "
            "Voigt-Kampff device, Deckard confronts escalating moral uncertainty regarding where synthetic simulation "
            "ends and authentic human compassion begins."
        ),
        "is_digital": True,
        "is_audio": True,
        "base_price": 590000,
    },
    {
        "title": "Ubik",
        "author_normalized": "philip k. dick",
        "publisher_slug": "porteghal",
        "genre": "SCI_FI",
        "genres": ["sci-fi", "philosophy"],
        "tags": ["cyberpunk", "time travel", "epistemology", "identity", "memory"],
        "isbn": "9780547572291",
        "language": "en",
        "publication_year": 1969,
        "edition": "Mariner Books Edition",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780547572291-L.jpg",
        "description": (
            "In a corporate-controlled future where psychic espionage and anti-telepathic agents battle across commercial "
            "arenas, Glen Runciter manages an organization dedicated to counteracting psionic intrusions. When a lunar "
            "ambush seemingly claims Runciter's life, his surviving team members, led by Joe Chip, begin experiencing "
            "chilling anomalies: currency regresses to obsolete denominations, technological hardware decays backwards in "
            "time, and Runciter's face manifests mysteriously on packaging. Their sole salvation lies in a mysterious, "
            "elusive commercial spray known as Ubik."
        ),
        "is_digital": True,
        "is_audio": False,
        "base_price": 540000,
    },
    {
        "title": "Dune",
        "author_normalized": "frank herbert",
        "publisher_slug": "ofogh",
        "genre": "SCI_FI",
        "genres": ["sci-fi"],
        "tags": ["galactic empire", "space exploration", "revolution", "leadership", "mysticism"],
        "isbn": "9780441172719",
        "language": "en",
        "publication_year": 1965,
        "edition": "Ace Premium Edition",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780441172719-L.jpg",
        "description": (
            "Set on the hostile desert planet of Arrakis, Dune chronicles the political and spiritual odyssey of young "
            "Paul Atreides, heir to a noble house betrayed by the rival Harkonnens with the blessing of the galactic "
            "Padishah Emperor. Arrakis is the solitary source across the known universe of the spice melange, an invaluable "
            "substance capable of extending human longevity and facilitating interstellar navigation. Paul allies himself "
            "with the resilient indigenous Fremen, discovering profound prescient abilities that may trigger an unstoppable "
            "holy jihad across civilized stars."
        ),
        "is_digital": True,
        "is_audio": True,
        "base_price": 950000,
    },
    {
        "title": "Dune Messiah",
        "author_normalized": "frank herbert",
        "publisher_slug": "ofogh",
        "genre": "SCI_FI",
        "genres": ["sci-fi", "philosophy"],
        "tags": ["galactic empire", "leadership", "free will", "ethics", "totalitarianism"],
        "isbn": "9780441102693",
        "language": "en",
        "publication_year": 1969,
        "edition": "Ace Mass Market Edition",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780441102693-L.jpg",
        "description": (
            "Twelve years after ascending to the imperial throne through holy conquest, Paul Atreides reigns as the divine "
            "emperor of a transformed cosmos, but his Fremen legions have unleashed a devastating galactic jihad claiming "
            "billions of lives. Trapped by the immutable burdens of his own prescient visions, Paul faces treacherous "
            "conspiracies from displaced galactic guilds, religious conspirators, and the Bene Gesserit sisterhood. "
            "Dune Messiah deconstructs the archetypal hero's journey, revealing the profound tragic perils of absolute "
            "authority and uncontrollable religious veneration."
        ),
        "is_digital": True,
        "is_audio": True,
        "base_price": 680000,
    },

    # --- SOFTWARE CRAFTSMANSHIP & TECHNOLOGY ---
    {
        "title": "Clean Code: A Handbook of Agile Software Craftsmanship",
        "author_normalized": "robert c. martin",
        "publisher_slug": "nasle-no",
        "genre": "TECH",
        "genres": ["technology"],
        "tags": ["clean code", "refactoring", "agile development", "software architecture"],
        "isbn": "9780132350884",
        "language": "en",
        "publication_year": 2008,
        "edition": "1st Edition",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg",
        "description": (
            "Even bad code can function, but if code isn't clean, it can bring a development organization to its knees, "
            "causing countless lost hours and significant resource waste. Software engineering veteran Robert C. Martin "
            "presents a revolutionary paradigm with Clean Code, establishing actionable principles, patterns, and practical "
            "exercises for crafting readable, maintainable, and elegant software. The book covers meaningful naming "
            "conventions, function brevity, proper formatting, robust exception handling, and disciplined unit testing "
            "strategies that separate true software craftsmen from mere coders."
        ),
        "is_digital": True,
        "is_audio": False,
        "base_price": 850000,
    },
    {
        "title": "Clean Architecture: A Craftsman's Guide to Software Structure and Design",
        "author_normalized": "robert c. martin",
        "publisher_slug": "nasle-no",
        "genre": "TECH",
        "genres": ["technology"],
        "tags": ["software architecture", "clean code", "system design", "domain-driven design"],
        "isbn": "9780134494166",
        "language": "en",
        "publication_year": 2017,
        "edition": "1st Edition",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780134494166-L.jpg",
        "description": (
            "Building upon decades of real-world software consulting, Uncle Bob Martin delineates universal rules of "
            "software architecture that drastically reduce lifetime maintenance costs and maximize engineering productivity. "
            "Clean Architecture guides software architects and senior engineers through decoupling high-level business rules "
            "from volatile external frameworks, databases, and user interfaces. Through rigorous separation of concerns and "
            "dependency inversion, Martin demonstrates how to construct resilient systems that remain easily testable, "
            "adaptable, and deployable throughout changing technological eras."
        ),
        "is_digital": True,
        "is_audio": False,
        "base_price": 890000,
    },
    {
        "title": "Domain-Driven Design: Tackling Complexity in the Heart of Software",
        "author_normalized": "eric evans",
        "publisher_slug": "nasle-no",
        "genre": "TECH",
        "genres": ["technology"],
        "tags": ["domain-driven design", "software architecture", "system design", "clean code"],
        "isbn": "9780321125217",
        "language": "en",
        "publication_year": 2003,
        "edition": "1st Edition",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780321125217-L.jpg",
        "description": (
            "The software community increasingly acknowledges that domain modeling is central to enterprise software design. "
            "In this seminal work, Eric Evans introduces the comprehensive framework of Domain-Driven Design (DDD), providing "
            "a systematic vocabulary and set of design practices for structuring complex business domains. Covering ubiquitous "
            "language, entities, value objects, aggregates, repositories, and bounded contexts, Evans explains how tightly "
            "coupling programmatic architecture to deep domain models prevents software decay and elevates team collaboration."
        ),
        "is_digital": True,
        "is_audio": False,
        "base_price": 1150000,
    },

    # --- CIVILIZATION, HISTORY & PSYCHOLOGY ---
    {
        "title": "Sapiens: A Brief History of Humankind",
        "author_normalized": "yuval noah harari",
        "publisher_slug": "ofogh",
        "genre": "HISTORY",
        "genres": ["history", "psychology"],
        "tags": ["civilization", "anthropology", "evolutionary biology", "human nature"],
        "isbn": "9780062316097",
        "language": "en",
        "publication_year": 2014,
        "edition": "1st US Edition",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg",
        "description": (
            "One hundred thousand years ago, at least six different human species inhabited the earth; today there is only "
            "one: Homo sapiens. How did our species succeed in the battle for dominance? Renowned historian Yuval Noah "
            "Harari bridges evolutionary biology, anthropology, and economics to chart the sweeping trajectory of human "
            "history. Sapiens explores how the Cognitive Revolution, the invention of shared fictions like money and religion, "
            "the Agricultural Revolution, and the Scientific Revolution enabled humans to cooperate in unprecedented masses "
            "and radically reshape the biosphere."
        ),
        "is_digital": True,
        "is_audio": True,
        "base_price": 820000,
    },
    {
        "title": "Homo Deus: A Brief History of Tomorrow",
        "author_normalized": "yuval noah harari",
        "publisher_slug": "ofogh",
        "genre": "HISTORY",
        "genres": ["history", "philosophy"],
        "tags": ["civilization", "artificial intelligence", "free will", "ethics", "human nature"],
        "isbn": "9780062464316",
        "language": "en",
        "publication_year": 2016,
        "edition": "1st US Edition",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780062464316-L.jpg",
        "description": (
            "In Homo Deus, Yuval Noah Harari turns his incisive analytical gaze forward into the uncharted future, "
            "examining what might happen when humankind's historical banes—famine, plague, and war—are largely conquered. "
            "Over the twenty-first century, as biotechnology and artificial intelligence merge, human endeavors will shift "
            "toward upgrading humans into gods, overcoming natural mortality, and creating artificial life. Harari explores "
            "the provocative philosophical questions emerging when algorithmic intelligence decouples from human consciousness."
        ),
        "is_digital": True,
        "is_audio": True,
        "base_price": 850000,
    },
    {
        "title": "Atomic Habits: An Easy & Proven Way to Build Good Habits & Break Bad Ones",
        "author_normalized": "james clear",
        "publisher_slug": "nasle-no",
        "genre": "PSYCHOLOGY",
        "genres": ["psychology", "business"],
        "tags": ["habits", "productivity", "human nature", "cognitive bias"],
        "isbn": "9780735211292",
        "language": "en",
        "publication_year": 2018,
        "edition": "Hardcover Edition",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg",
        "description": (
            "No matter your personal or professional aspirations, Atomic Habits provides a proven framework for improving "
            "every day. James Clear, one of the world's leading experts on habit formation, reveals practical strategies "
            "that teach you exactly how to form good habits, break bad ones, and master the tiny behaviors that compound "
            "into remarkable outcomes. Drawing on concepts from biology, cognitive psychology, and neuroscience, Clear "
            "demonstrates that monumental change doesn't require drastic upheaval, but rather the cumulative effect of hundreds "
            "of tiny, deliberate atomic choices."
        ),
        "is_digital": True,
        "is_audio": True,
        "base_price": 620000,
    },

    # --- EXISTENTIAL PHILOSOPHY & CLASSICS ---
    {
        "title": "The Stranger",
        "author_normalized": "albert camus",
        "publisher_slug": "cheshmeh",
        "genre": "FICTION",
        "genres": ["fiction", "philosophy"],
        "tags": ["existentialism", "absurdism", "morality", "solitude", "ethics"],
        "isbn": "9780679720201",
        "language": "en",
        "publication_year": 1942,
        "edition": "Vintage International Edition",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780679720201-L.jpg",
        "description": (
            "Through the detached and unflinching narrative voice of Meursault, a young French-Algerian clerk, Albert "
            "Camus crafts one of the foundational literary classics of the twentieth century. When Meursault fails to "
            "exhibit conventional emotional grief at his mother's funeral and later fatally shoots an Arab acquaintance "
            "on a sweltering Mediterranean beach, the legal justice system condemns him not merely for the violent act, "
            "but for his profound refusal to participate in societal hypocrisies and counterfeit sentimental rituals. "
            "The Stranger masterfully encapsulates Camus's philosophy of the Absurd."
        ),
        "is_digital": True,
        "is_audio": True,
        "base_price": 450000,
    },
    {
        "title": "The Myth of Sisyphus",
        "author_normalized": "albert camus",
        "publisher_slug": "cheshmeh",
        "genre": "PHILOSOPHY",
        "genres": ["philosophy"],
        "tags": ["absurdism", "existentialism", "free will", "morality", "stoicism"],
        "isbn": "9780679733737",
        "language": "en",
        "publication_year": 1942,
        "edition": "Vintage Books Edition",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780679733737-L.jpg",
        "description": (
            "Opening with the famous declaration that there is but one truly serious philosophical problem—suicide—Albert "
            "Camus's landmark philosophical essay investigates whether human life is worth living in the face of an "
            "indifferent and meaningless universe. Rejecting both physical surrender and philosophical escapism through "
            "religious dogma, Camus proposes that authentic dignity lies in lucidity, rebellion, and passionate engagement "
            "with our finite existence. Drawing upon the Greek myth of Sisyphus perpetually rolling his boulder up the "
            "mountain, Camus concludes that we must imagine Sisyphus happy."
        ),
        "is_digital": True,
        "is_audio": False,
        "base_price": 490000,
    },
    {
        "title": "Crime and Punishment",
        "author_normalized": "fyodor dostoevsky",
        "publisher_slug": "negah",
        "genre": "FICTION",
        "genres": ["fiction", "psychology"],
        "tags": ["morality", "ethics", "human nature", "grief", "psychotherapy"],
        "isbn": "9780140449136",
        "language": "en",
        "publication_year": 1866,
        "edition": "Penguin Classics Edition",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780140449136-L.jpg",
        "description": (
            "Impoverished former student Rodion Raskolnikov conceives an arrogant intellectual theory dividing humanity "
            "into ordinary masses and extraordinary individuals entitled to transgress legal codes for higher purposes. "
            "Testing his conviction in nineteenth-century Saint Petersburg, he brutally murders a greedy old pawnbroker, "
            "only to find himself immediately plunged into a psychological inferno of guilt, fevered hallucinations, "
            "and cunning interrogation by magistrate Porfiry Petrovich. Dostoevsky's psychological masterwork traces "
            "Raskolnikov's excruciating journey toward moral awakening, spiritual rebirth, and redemption."
        ),
        "is_digital": True,
        "is_audio": True,
        "base_price": 880000,
    },
    {
        "title": "The Brothers Karamazov",
        "author_normalized": "fyodor dostoevsky",
        "publisher_slug": "negah",
        "genre": "FICTION",
        "genres": ["fiction", "philosophy"],
        "tags": ["morality", "ethics", "free will", "existentialism", "human nature"],
        "isbn": "9780374528379",
        "language": "en",
        "publication_year": 1880,
        "edition": "Farrar Straus Giroux Edition",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780374528379-L.jpg",
        "description": (
            "Dostoevsky's crowning final masterpiece revolves around the murder of the vulgar patriarch Fyodor Pavlovich "
            "Karamazov and the fierce rivalries dividing his three distinct sons: passionate soldier Dmitri, intellectual "
            "rationalist Ivan, and spiritual novice Alyosha. Featuring the legendary philosophical parable 'The Grand "
            "Inquisitor', the monumental novel penetrates the deepest questions confronting humanity: the existence of God, "
            "the burden of moral free will, the agony of innocent suffering, and the transformative power of compassionate "
            "universal love."
        ),
        "is_digital": True,
        "is_audio": True,
        "base_price": 1250000,
    },

    # --- AUTHENTIC PERSIAN MASTERWORKS (LANGUAGE BOUNDARY CASES) ---
    {
        "title": "بوف کور (The Blind Owl)",
        "author_normalized": "sadegh hedayat",
        "publisher_slug": "negah",
        "genre": "PERSIAN_LIT",
        "genres": ["persian-literature", "fiction"],
        "tags": ["solitude", "memory", "modernism", "identity"],
        "isbn": "9789643510015",
        "language": "fa",
        "publication_year": 1937,
        "edition": "چاپ نفیس انتشارات نگاه",
        "cover_image_url": "/images/pic1.jpg",
        "description": (
            "شاهکار ادبیات مدرن ایران و شناخته‌شده‌ترین رمان فارسی در جهان؛ رمانی سوررئالیستی و چندلایه درباره انزوا، "
            "عشق اثیری و لایه‌های تاریک روان آدمی. راوی داستان، نقاش قلمدان‌ساز تکیده‌ای در ری باستان است که در "
            "کابوس‌های وهم‌آلودش مدام با زن اثیری، پیرمرد خنزرپنزری و سایه‌ای شبیه به بوف روبرو می‌شود. هدایت با روایتی "
            "تکرارشونده و بی‌زمان، مرزهای واقعیت و توهم را درهم می‌آمیزد و تصویری فراموش‌نشدنی از رنج هستی‌شناختی بشر معاصر خلق می‌کند."
        ),
        "is_digital": True,
        "is_audio": True,
        "base_price": 550000,
    },
    {
        "title": "چشم‌هایش (Her Eyes)",
        "author_normalized": "bozorg alavi",
        "publisher_slug": "negah",
        "genre": "PERSIAN_LIT",
        "genres": ["persian-literature", "fiction"],
        "tags": ["revolution", "identity", "memory", "class struggle"],
        "isbn": "9789643510022",
        "language": "fa",
        "publication_year": 1952,
        "edition": "ویراست جدید انتشارات نگاه",
        "cover_image_url": "/images/pic2.jpg",
        "description": (
            "رمانی ماندگار و پیشرو در تلفیق درام عاشقانه با ادبیات مقاومت و مبارزات سیاسی دهه بیست ایران. ماجرا پیرامون "
            "پرده نقاشی مرموزی به نام «چشم‌هایش» اثر استاد ماکان، نقاش برجسته و رهبر پنهان جنبش آزادی‌خواهی شکل می‌گیرد که "
            "پس از تبعید و درگذشت مشکوکش در زندان بر جای مانده است. راوی کنجکاو، زن صاحب آن چشم‌های مسحورکننده یعنی فرنگیس را "
            "می‌یابد و پرده از راز ایثار، خیانت، عشق و فداکاری در دوران اختناق برمی‌دارد."
        ),
        "is_digital": True,
        "is_audio": True,
        "base_price": 580000,
    },
    {
        "title": "سووشون (Savushun)",
        "author_normalized": "simin daneshvar",
        "publisher_slug": "cheshmeh",
        "genre": "PERSIAN_LIT",
        "genres": ["persian-literature", "history"],
        "tags": ["iranian history", "revolution", "grief", "civilization"],
        "isbn": "9789643510039",
        "language": "fa",
        "publication_year": 1969,
        "edition": "چاپ چهلم انتشارات خوارزمی",
        "cover_image_url": "/images/pic3.jpg",
        "description": (
            "نخستین رمان درخشان زنانه در تاریخ ادبیات نوین فارسی که وقایع پرالتهاب فارس و شیراز را در خلال جنگ جهانی دوم "
            "و اشغال ایران توسط نیروهای متفقین به تصویر می‌کشد. زری، مادری آرام و مهربان، نظاره‌گر ایستادگی همسر شجاعش یوسف "
            "در برابر قحطی ساختگی و چپاول غلات توسط ارتش بریتانیاست. این شاهکار پرشکوه با تلفیق اسطوره سیاوش با آیین‌های "
            "حماسی و سوگواری بومی، فرایند بیداری وجدان اجتماعی و تحول زری به زنی مقتدر را روایت می‌کند."
        ),
        "is_digital": True,
        "is_audio": True,
        "base_price": 680000,
    },
    {
        "title": "کلیدر (Kelidar)",
        "author_normalized": "mahmoud dowlatabadi",
        "publisher_slug": "cheshmeh",
        "genre": "PERSIAN_LIT",
        "genres": ["persian-literature", "fiction"],
        "tags": ["iranian history", "class struggle", "leadership", "civilization"],
        "isbn": "9789643510046",
        "language": "fa",
        "publication_year": 1979,
        "edition": "دوره کامل ۱۰ جلدی",
        "cover_image_url": "/images/pic4.jpg",
        "description": (
            "حماسه عظیم و ده جلدی محمود دولت‌آبادی که زندگی عشایر کرد کرمانج خراسان را در سال‌های پس از جنگ جهانی دوم "
            "به زیباترین نثر داستانی روایت می‌کند. گل‌محمد کلمیشی، جوانمرد و عیار ایلیاتی، در اعتراض به ستم اربابان، ژاندارم‌ها "
            "و انزوای روستاییان به پا می‌خیزد. دولت‌آبادی با واژگانی غنی، توصیفاتی بی‌مانند از جغرافیای کویر و خلق شخصیت‌های "
            "پولادین، تابلویی سترگ از ایستادگی، عشق، فقر و تراژدی تاریخی توده‌های زحمتکش ایران رقم می‌زند."
        ),
        "is_digital": True,
        "is_audio": True,
        "base_price": 1100000,
    },
    {
        "title": "سمفونی مردگان (Symphony of the Dead)",
        "author_normalized": "abbas maroufi",
        "publisher_slug": "cheshmeh",
        "genre": "PERSIAN_LIT",
        "genres": ["persian-literature", "fiction"],
        "tags": ["grief", "modernism", "identity"],
        "isbn": "9789643510053",
        "language": "fa",
        "publication_year": 1989,
        "edition": "چاپ سی و پنجم نشر ققنوس",
        "cover_image_url": "/images/pic5.jpg",
        "description": (
            "شاهکار تراژیک ادبیات معاصر ایران با الهام از موومان‌های سمفونی شماره ۵ بتهوون؛ رمانی روان‌شناختی درباره نابودی "
            "معصومیت و ذوق هنری در برابر استبداد سنتی و حسادت برادرانه. ماجرای خانواده اورخانی در اردبیل سرد سال‌های جنگ جهانی دوم، "
            "کشمکش تلخ آیدین، جوان شاعر و حساس را با برادر بازاری‌اش اورهان به تصویر می‌کشد. معروفی با جریان سیال ذهن و تغییر "
            "زاویه دید، مرثیه‌ای ماندگار برای هنر، رفاقت، سرکوب خلاقیت و غربت روح آدمی سروده است."
        ),
        "is_digital": True,
        "is_audio": True,
        "base_price": 620000,
    },
    {
        "title": "شازده احتجاب (Prince Ehtejab)",
        "author_normalized": "houshang golshiri",
        "publisher_slug": "cheshmeh",
        "genre": "PERSIAN_LIT",
        "genres": ["persian-literature", "history"],
        "tags": ["iranian history", "totalitarianism", "memory", "identity"],
        "isbn": "9789643510060",
        "language": "fa",
        "publication_year": 1969,
        "edition": "چاپ بیستم انتشارات نیلوفر",
        "cover_image_url": "/images/pic6.jpg",
        "description": (
            "رمانی مدرن و درخشان در تحلیل زوال اشرافیت قاجار و جنون استبداد خانوادگی در بستر تکنیک تک‌گویی درونی. شازده خسرو احتجاب، "
            "بازمانده مسلول خاندانی ستمگر، در آخرین شب زندگی خود در عمارتی در حال فروریختن، خاطرات پدر و جد خونریزش را مرور می‌کند. "
            "گلشیری با ایجازی شگفت‌انگیز و استادی در تعلیق روایی، ریشه‌های خشونت موروثی، تباهی فردی و فساد قدرت مطلقه را در تاریک‌روشن "
            "تاریخ معاصر ایران جراحی می‌کند."
        ),
        "is_digital": True,
        "is_audio": True,
        "base_price": 480000,
    },
    {
        "title": "جای خالی سلوچ (Missing Soluch)",
        "author_normalized": "mahmoud dowlatabadi",
        "publisher_slug": "cheshmeh",
        "genre": "PERSIAN_LIT",
        "genres": ["persian-literature", "fiction"],
        "tags": ["human nature", "class struggle", "iranian history"],
        "isbn": "9789643510077",
        "language": "fa",
        "publication_year": 1979,
        "edition": "چاپ سی‌ام انتشارات چشمه",
        "cover_image_url": "/images/pic7.jpg",
        "description": (
            "داستان ناپدید شدن ناگهانی سلوچ، کشاورز زحمتکش روستای زمینج، و تلاش قهرمانانه همسرش مرگان برای حفظ بقای خانواده در "
            "مواجهه با قحطی، فقر و طمع اربابان محلی. دولت‌آبادی با نثری گیرا و کوبنده، تصویر مقاومت خستگی‌ناپذیر زن روستایی ایرانی "
            "را ترسیم می‌کند که در غیاب مرد خانه، بار سنگین کار بر زمین‌های بایر و دفاع از حرمت فرزندانش را در سخت‌ترین شرایط "
            "اجتماعی بر دوش می‌کشد."
        ),
        "is_digital": True,
        "is_audio": True,
        "base_price": 590000,
    },
    {
        "title": "یک عاشقانه آرام (A Quiet Romance)",
        "author_normalized": "sadegh hedayat",
        "publisher_slug": "rozaneh",
        "genre": "PERSIAN_LIT",
        "genres": ["persian-literature", "philosophy"],
        "tags": ["persian poetry", "human nature", "habits"],
        "isbn": "9789643510084",
        "language": "fa",
        "publication_year": 1995,
        "edition": "چاپ پنجاهم نشر روزبهان",
        "cover_image_url": "/images/pic8.jpg",
        "description": (
            "رمانی شاعرانه و حکیمانه درباره عشق حقیقی، صبر و پاسداشت شور عاشقانه در روزمرگی‌های زندگی مشترک. ماجرای معلم مبارز "
            "گیلانی و همسر تركمنش عسل که نشان می‌دهند چگونه می‌توان در برابر تکرار و عادت ایستادگی کرد. کتاب سرشار از نامه‌ها، "
            "دیالوگ‌های گوش‌نواز و تاملات عمیق فلسفی درباره وفاداری، آرمان‌خواهی، پایداری عاطفی و زیبایی‌های فرهنگ بومی ایران است."
        ),
        "is_digital": True,
        "is_audio": True,
        "base_price": 490000,
    },
    {
        "title": "Thinking, Fast and Slow",
        "author_normalized": "daniel kahneman",
        "publisher_slug": "nasle-no",
        "genre": "PSYCHOLOGY",
        "genres": ["psychology", "business"],
        "tags": ["cognitive bias", "human nature", "habits", "psychotherapy"],
        "isbn": "9780374275631",
        "language": "en",
        "publication_year": 2011,
        "edition": "Farrar Straus and Giroux Edition",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780374275631-L.jpg",
        "description": (
            "Nobel laureate Daniel Kahneman takes us on a groundbreaking tour of the mind, explaining the two systems that drive "
            "the way we think. System 1 is fast, intuitive, and emotional; System 2 is slower, more deliberative, and more logical. "
            "Kahneman exposes the extraordinary capabilities—and also the faults and systematic biases—of fast thinking, revealing "
            "where we can and cannot trust our intuitions and how we can tap into the benefits of slow thinking in business, "
            "investing, and personal choices."
        ),
        "is_digital": True,
        "is_audio": True,
        "base_price": 790000,
    },
    {
        "title": "Man's Search for Meaning",
        "author_normalized": "viktor e. frankl",
        "publisher_slug": "rozaneh",
        "genre": "PSYCHOLOGY",
        "genres": ["psychology", "philosophy"],
        "tags": ["existentialism", "psychotherapy", "human nature", "grief", "stoicism"],
        "isbn": "9780807014295",
        "language": "en",
        "publication_year": 1946,
        "edition": "Beacon Press Edition",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780807014295-L.jpg",
        "description": (
            "Psychiatrist Viktor Frankl's memoir of his harrowing internment in Auschwitz and other concentration camps is a timeless "
            "meditation on human resilience and spiritual endurance. Frankl argues that we cannot avoid suffering, but we can choose "
            "how to cope with it, find meaning in it, and move forward with renewed purpose. His theory of logotherapy emphasizes "
            "that humanity's primary motivational drive is not pleasure, but the discovery and pursuit of what we personally find meaningful."
        ),
        "is_digital": True,
        "is_audio": True,
        "base_price": 480000,
    },
    {
        "title": "Meditations",
        "author_normalized": "marcus aurelius",
        "publisher_slug": "rozaneh",
        "genre": "PHILOSOPHY",
        "genres": ["philosophy"],
        "tags": ["stoicism", "ethics", "morality", "leadership"],
        "isbn": "9780140449334",
        "language": "en",
        "publication_year": 180,
        "edition": "Penguin Classics Edition",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780140449334-L.jpg",
        "description": (
            "Recorded in private notebooks during military campaigns on the frontiers of the Roman Empire, the Meditations of Marcus "
            "Aurelius offer enduring spiritual guidance on living a life of virtue, wisdom, and inner tranquility. Grounded in Stoic "
            "philosophy, Marcus addresses universal human challenges: dealing with adversity, mastering turbulent emotions, performing "
            "civic duty without complaint, and accepting mortality with quiet grace and rational fortitude."
        ),
        "is_digital": True,
        "is_audio": True,
        "base_price": 450000,
    },
    {
        "title": "Zero to One: Notes on Startups, or How to Build the Future",
        "author_normalized": "peter thiel",
        "publisher_slug": "nasle-no",
        "genre": "BUSINESS",
        "genres": ["business", "technology"],
        "tags": ["startup", "entrepreneurship", "venture capital", "productivity"],
        "isbn": "9780804139298",
        "language": "en",
        "publication_year": 2014,
        "edition": "Crown Business Edition",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780804139298-L.jpg",
        "description": (
            "The great secret of our time is that there are still uncharted frontiers to explore and new inventions to create. In Zero to "
            "One, legendary entrepreneur and investor Peter Thiel shows how we can find singular ways to create those new things. Doing "
            "what someone else already knows how to do takes the world from 1 to n; but when you do something new, you go from 0 to 1. "
            "Thiel presents an optimistic view of the future of progress in America and a new way of thinking about innovation."
        ),
        "is_digital": True,
        "is_audio": True,
        "base_price": 580000,
    },
    {
        "title": "The Lean Startup",
        "author_normalized": "eric ries",
        "publisher_slug": "nasle-no",
        "genre": "BUSINESS",
        "genres": ["business", "technology"],
        "tags": ["startup", "agile development", "entrepreneurship", "system design"],
        "isbn": "9780307887894",
        "language": "en",
        "publication_year": 2011,
        "edition": "Crown Business Edition",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780307887894-L.jpg",
        "description": (
            "Most startups fail. But many of those failures are preventable. The Lean Startup is a revolutionary approach being adopted "
            "across the globe, changing the way companies are built and new products are launched. Eric Ries defines a startup as an "
            "organization dedicated to creating something new under conditions of extreme uncertainty. The Lean Startup methodology fosters "
            "companies that are both more capital efficient and that leverage human creativity more effectively."
        ),
        "is_digital": True,
        "is_audio": True,
        "base_price": 640000,
    },
    {
        "title": "The Pragmatic Programmer: Your Journey to Mastery",
        "author_normalized": "david thomas & andrew hunt",
        "publisher_slug": "nasle-no",
        "genre": "TECH",
        "genres": ["technology"],
        "tags": ["clean code", "refactoring", "software architecture", "agile development"],
        "isbn": "9780135957059",
        "language": "en",
        "publication_year": 2019,
        "edition": "20th Anniversary Edition",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780135957059-L.jpg",
        "description": (
            "One of the most significant books in modern software development, The Pragmatic Programmer cuts through the increasing "
            "specialization and technical churn of modern development to examine the core essence of software craftsmanship. Filled with "
            "classic analogies and practical advice, Dave Thomas and Andy Hunt explore code cleanliness, DRY principles, orthogonality, "
            "automated testing, and lifelong professional learning for engineers who care about building resilient systems."
        ),
        "is_digital": True,
        "is_audio": False,
        "base_price": 920000,
    },
    {
        "title": "Neuromancer",
        "author_normalized": "william gibson",
        "publisher_slug": "porteghal",
        "genre": "SCI_FI",
        "genres": ["sci-fi"],
        "tags": ["cyberpunk", "artificial intelligence", "dystopia", "surveillance"],
        "isbn": "9780441569595",
        "language": "en",
        "publication_year": 1984,
        "edition": "Ace 35th Anniversary Edition",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780441569595-L.jpg",
        "description": (
            "The sky above the port was the color of television, tuned to a dead channel. Case was the sharpest data-thief in the matrix "
            "until he crossed the wrong people and they damaged his nervous system. Now a mysterious new employer recruits him for a "
            "last-chance run at an unthinkably powerful corporate artificial intelligence orbiting high above Earth. Winner of the Hugo, "
            "Nebula, and Philip K. Dick Awards, Neuromancer ignited the cyberpunk movement and redefined modern science fiction."
        ),
        "is_digital": True,
        "is_audio": True,
        "base_price": 610000,
    },
    {
        "title": "Foundation",
        "author_normalized": "isaac asimov",
        "publisher_slug": "porteghal",
        "genre": "SCI_FI",
        "genres": ["sci-fi"],
        "tags": ["galactic empire", "civilization", "space exploration", "societal collapse"],
        "isbn": "9780553293357",
        "language": "en",
        "publication_year": 1951,
        "edition": "Spectra Mass Market Edition",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780553293357-L.jpg",
        "description": (
            "For twelve thousand years the Galactic Empire has ruled supreme. Now it is dying. But only Hari Seldon, creator of the revolutionary "
            "science of psychohistory, can foresee its inevitable fall—and the dark age of barbarism that will last thirty thousand years. To preserve "
            "knowledge and save humankind, Seldon gathers the best minds in the Empire and sends them to a bleak sanctuary on the edge of the galaxy "
            "known as the Foundation. Asimov's monumental epic won the special Hugo Award for Best All-Time Series."
        ),
        "is_digital": True,
        "is_audio": True,
        "base_price": 650000,
    },
    {
        "title": "One Hundred Years of Solitude",
        "author_normalized": "gabriel garcia marquez",
        "publisher_slug": "cheshmeh",
        "genre": "FICTION",
        "genres": ["fiction"],
        "tags": ["magical realism", "solitude", "memory", "family"],
        "isbn": "9780060883287",
        "language": "en",
        "publication_year": 1967,
        "edition": "Harper Perennial Modern Classics",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780060883287-L.jpg",
        "description": (
            "One Hundred Years of Solitude tells the story of the rise and fall, birth and death of the mythical town of Macondo through the "
            "history of the Buendía family. Inventive, amusing, magnetic, sad, and alive with unforgettable men and women—brimming with truth, "
            "compassion, and lyrical magic that strike the soul—this work by Nobel laureate Gabriel García Márquez is considered one of the "
            "paramount masterpieces of universal world literature and the defining work of magical realism."
        ),
        "is_digital": True,
        "is_audio": True,
        "base_price": 780000,
    },
    {
        "title": "Fahrenheit 451",
        "author_normalized": "ray bradbury",
        "publisher_slug": "ofogh",
        "genre": "SCI_FI",
        "genres": ["sci-fi", "fiction"],
        "tags": ["dystopia", "censorship", "surveillance", "totalitarianism"],
        "isbn": "9781451673319",
        "language": "en",
        "publication_year": 1953,
        "edition": "Simon & Schuster 60th Anniversary Edition",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9781451673319-L.jpg",
        "description": (
            "Guy Montag is a fireman. His job is to destroy the most illegal of all commodities, the printed book, along with the houses in which "
            "they are hidden. Montag never questions the destruction and ruin his actions produce, returning each day to his bland life and wife, "
            "Mildred, who spends all day with her television 'family.' But when he meets an eccentric young neighbor, Clarisse, who introduces him "
            "to a past where people didn't live in fear and to a present where one sees the world through the ideas in books, Montag begins to question everything."
        ),
        "is_digital": True,
        "is_audio": True,
        "base_price": 560000,
    },
    {
        "title": "The Metamorphosis",
        "author_normalized": "franz kafka",
        "publisher_slug": "negah",
        "genre": "FICTION",
        "genres": ["fiction", "philosophy"],
        "tags": ["absurdism", "existentialism", "solitude", "identity"],
        "isbn": "9780553213690",
        "language": "en",
        "publication_year": 1915,
        "edition": "Bantam Classics Edition",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780553213690-L.jpg",
        "description": (
            "When Gregor Samsa woke up one morning from unsettling dreams, he found himself changed in his bed into a monstrous vermin. Franz "
            "Kafka's haunting novella is an unforgettable exploration of human alienation, psychological guilt, family cruelty, and existential "
            "horror. As Gregor struggles to adapt to his grotesque physical condition and observe his family's growing disgust, Kafka strips "
            "bare the transactional and fragile veneer of modern bourgeois domesticity."
        ),
        "is_digital": True,
        "is_audio": True,
        "base_price": 380000,
    },
    {
        "title": "The Prince",
        "author_normalized": "niccolo machiavelli",
        "publisher_slug": "rozaneh",
        "genre": "PHILOSOPHY",
        "genres": ["philosophy", "history"],
        "tags": ["leadership", "ethics", "morality", "civilization"],
        "isbn": "9780140449150",
        "language": "en",
        "publication_year": 1532,
        "edition": "Penguin Classics Edition",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780140449150-L.jpg",
        "description": (
            "Written in 1513 by Italian diplomat and political philosopher Niccolò Machiavelli, The Prince is arguably the most influential "
            "and provocative treatise on political power, governance, and statecraft ever penned. Machiavelli dispenses with classical and "
            "religious moral idealism, arguing that a ruler must prioritize state survival, political expediency, and pragmatic cunning "
            "over conventional virtue. His revolutionary analysis remains essential reading for understanding political realism and institutional leadership."
        ),
        "is_digital": True,
        "is_audio": False,
        "base_price": 420000,
    },
    {
        "title": "A Brief History of Time",
        "author_normalized": "stephen hawking",
        "publisher_slug": "ofogh",
        "genre": "TECH",
        "genres": ["technology", "history"],
        "tags": ["space exploration", "time travel", "epistemology"],
        "isbn": "9780553380163",
        "language": "en",
        "publication_year": 1988,
        "edition": "Bantam 10th Anniversary Edition",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780553380163-L.jpg",
        "description": (
            "A landmark volume in science writing by one of the great minds of our time, Stephen Hawking's book explores such profound questions "
            "as: How did the universe begin—and what made its beginning possible? Does time always flow forward? Is the universe unending—or are "
            "there boundaries? Are there other dimensions in space? What will happen when it all ends? Told in language we can all understand, "
            "A Brief History of Time plunges into the distant galaxies, black holes, and quarks that define the cosmos."
        ),
        "is_digital": True,
        "is_audio": True,
        "base_price": 690000,
    },
    {
        "title": "Notes from Underground",
        "author_normalized": "fyodor dostoevsky",
        "publisher_slug": "negah",
        "genre": "PHILOSOPHY",
        "genres": ["philosophy", "fiction"],
        "tags": ["existentialism", "human nature", "free will", "solitude", "identity"],
        "isbn": "9780679734529",
        "language": "en",
        "publication_year": 1864,
        "edition": "Vintage Classics Edition",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780679734529-L.jpg",
        "description": (
            "Widely regarded as the first existentialist novel, Notes from Underground presents the bitter, contradictory monologue of an "
            "anonymous retired civil servant living in voluntary isolation in Saint Petersburg. Railing against nineteenth-century utilitarianism, "
            "mathematical rationalism, and utopian visions of social harmony, the Underground Man fiercely asserts humanity's irrational desire "
            "for unconstrained freedom, even when it results in spiteful self-destruction. Dostoevsky lays bare the neuroses that dominate modern psychological fiction."
        ),
        "is_digital": True,
        "is_audio": False,
        "base_price": 420000,
    },
]

def seed_books(authors_map, publishers_map, genres_map, tags_map, stdout=None):
    """
    Seeds curated books, establishing:
    1. Direct Book record with language, genres, tags, publication_year, edition
    2. Backward-compatible Book.genre CharField
    3. BookFormat records (PHYSICAL, DIGITAL, AUDIO)
    4. Active Prices in IRR
    5. Historical APPLIED BookCreateProposal linking Book to Publisher
    """
    created_books = []

    for b_data in CURATED_BOOKS:
        author = authors_map.get(b_data["author_normalized"])
        publisher = publishers_map.get(b_data["publisher_slug"])
        if not author:
            continue

        book_slug = slugify(b_data["title"])
        if not book_slug:
            book_slug = f"book-{b_data['isbn']}"

        # Determine semantic content tone and target age group
        tone = b_data.get("content_tone")
        if not tone:
            g_list = b_data.get("genres", [])
            t_list = b_data.get("tags", [])
            if any(t in t_list for t in ["dystopia", "totalitarianism", "surveillance"]):
                tone = "dystopian"
            elif any(g in g_list for g in ["technology", "business"]) or "system design" in t_list or "clean code" in t_list:
                tone = "academic"
            elif any(t in t_list for t in ["mysticism", "persian poetry", "عرفان و تصوف"]):
                tone = "mystical"
            elif any(t in t_list for t in ["habits", "productivity", "leadership"]):
                tone = "inspiring"
            else:
                tone = "philosophical"

        age_group = b_data.get("target_age_group", "adult")

        book, created = Book.objects.update_or_create(
            isbn=b_data["isbn"],
            defaults={
                "author": author,
                "title": b_data["title"],
                "slug": book_slug,
                "description": b_data["description"],
                "genre": b_data["genre"],
                "language": b_data["language"],
                "target_age_group": age_group,
                "content_tone": tone,
                "publication_year": b_data.get("publication_year"),
                "edition": b_data.get("edition", ""),
                "cover_image_url": b_data["cover_image_url"],
                "is_digital": b_data["is_digital"],
                "is_audio": b_data["is_audio"],
                "digital_file_path": "/files/sample.epub" if b_data["is_digital"] else "",
                "audio_file_path": "/audio/sample.mp3" if b_data["is_audio"] else "",
            },
        )

        # Sync Many-to-Many Genres
        genre_objs = [genres_map[g_slug] for g_slug in b_data.get("genres", []) if g_slug in genres_map]
        if genre_objs:
            book.genres.set(genre_objs)

        # Sync Many-to-Many Tags
        tag_objs = [tags_map[t_name] for t_name in b_data.get("tags", []) if t_name in tags_map]
        if tag_objs:
            book.tags.set(tag_objs)

        # Create BookFormats & Prices
        base_price_val = Decimal(b_data["base_price"])

        # 1. PHYSICAL FORMAT
        phys_fmt, _ = BookFormat.objects.update_or_create(
            book=book,
            format_type=BookFormat.FormatType.PHYSICAL,
            defaults={"is_available": True},
        )
        Price.objects.update_or_create(
            book=book,
            book_format=phys_fmt,
            defaults={
                "value": base_price_val,
                "min_price": base_price_val * Decimal("0.8"),
                "effective_from": timezone.now() - timezone.timedelta(days=90),
                "effective_until": None,
            },
        )

        # 2. DIGITAL FORMAT
        if b_data["is_digital"]:
            dig_fmt, _ = BookFormat.objects.update_or_create(
                book=book,
                format_type=BookFormat.FormatType.DIGITAL,
                defaults={"is_available": True},
            )
            Price.objects.update_or_create(
                book=book,
                book_format=dig_fmt,
                defaults={
                    "value": Decimal(int(base_price_val * Decimal("0.55"))),
                    "min_price": Decimal(int(base_price_val * Decimal("0.4"))),
                    "effective_from": timezone.now() - timezone.timedelta(days=90),
                    "effective_until": None,
                },
            )

        # 3. AUDIO FORMAT
        if b_data["is_audio"]:
            aud_fmt, _ = BookFormat.objects.update_or_create(
                book=book,
                format_type=BookFormat.FormatType.AUDIO,
                defaults={"is_available": True},
            )
            Price.objects.update_or_create(
                book=book,
                book_format=aud_fmt,
                defaults={
                    "value": Decimal(int(base_price_val * Decimal("0.70"))),
                    "min_price": Decimal(int(base_price_val * Decimal("0.55"))),
                    "effective_from": timezone.now() - timezone.timedelta(days=90),
                    "effective_until": None,
                },
            )

        # 4. Link Publisher via BookCreateProposal
        if publisher:
            membership = publisher.members.first()
            submitter = membership.user if membership else None

            # Create an APPLIED proposal so BookDetailSerializer resolves publisher details
            proposal, _ = Proposal.objects.update_or_create(
                title=f"انتشار کتاب: {book.title}",
                publisher=publisher,
                defaults={
                    "submitted_by": submitter,
                    "proposal_type": Proposal.ProposalType.BOOK_CREATE,
                    "status": Proposal.Status.APPLIED,
                },
            )
            BookCreateProposal.objects.update_or_create(
                proposal=proposal,
                defaults={
                    "created_book": book,
                    "author": book.author,
                    "title": book.title,
                    "description": book.description,
                    "isbn": book.isbn,
                    "cover_image_url": book.cover_image_url,
                    "genre": book.genre,
                    "is_digital": book.is_digital,
                    "is_audio": book.is_audio,
                    "digital_file_path": book.digital_file_path,
                    "audio_file_path": book.audio_file_path,
                },
            )

        created_books.append(book)

    if stdout:
        stdout.write(f"  ✓ Seeded {len(created_books)} books with formats, IRR prices, and publisher links.")

    return created_books
