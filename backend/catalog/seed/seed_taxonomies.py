"""
Taxonomy Seeder: Canonical Genres and Thematic Tags.
Conforms to S1&2_catalog_model_changes.md and S3_dataset_creation_guide.md.
"""
from catalog.models import Genre, Tag

CANONICAL_GENRES = [
    {
        "name": "Fiction",
        "slug": "fiction",
        "normalized_name": "fiction",
        "description": "Imaginative literary works including classic prose, magical realism, drama, and contemporary narratives.",
    },
    {
        "name": "Science Fiction",
        "slug": "sci-fi",
        "normalized_name": "science fiction",
        "description": "Speculative literature exploring futuristic science, technology, interstellar travel, and dystopian futures.",
    },
    {
        "name": "Philosophy",
        "slug": "philosophy",
        "normalized_name": "philosophy",
        "description": "Exploration of fundamental questions about existence, reason, knowledge, ethics, mind, and the human condition.",
    },
    {
        "name": "Psychology",
        "slug": "psychology",
        "normalized_name": "psychology",
        "description": "Empirical and clinical inquiry into human behavior, cognition, mental habits, emotions, and consciousness.",
    },
    {
        "name": "Technology",
        "slug": "technology",
        "normalized_name": "technology",
        "description": "Computer science, software engineering practices, system design, architectural principles, and technological progress.",
    },
    {
        "name": "History",
        "slug": "history",
        "normalized_name": "history",
        "description": "Chronicles of civilization, political revolutions, cultural evolution, and world historical developments.",
    },
    {
        "name": "Business",
        "slug": "business",
        "normalized_name": "business",
        "description": "Entrepreneurship, market economics, organizational strategy, lean methodologies, and managerial leadership.",
    },
    {
        "name": "Persian Literature",
        "slug": "persian-literature",
        "normalized_name": "persian literature",
        "description": "Classical and modern Iranian literary masterworks, Persian poetry, mystical treatises, and historical prose.",
    },
]

THEMATIC_TAGS = [
    # Dystopian & Societal
    {"name": "Dystopia", "normalized_name": "dystopia", "description": "Societies characterized by oppressive state control, totalitarian misery, or systemic injustice.", "language": "en"},
    {"name": "Totalitarianism", "normalized_name": "totalitarianism", "description": "Dictatorial centralized government requiring complete subservience to the state.", "language": "en"},
    {"name": "Surveillance", "normalized_name": "surveillance", "description": "Pervasive state monitoring, loss of privacy, and behavioral control.", "language": "en"},
    {"name": "Censorship", "normalized_name": "censorship", "description": "Suppression of speech, free thought, prohibited literature, and forbidden information.", "language": "en"},
    {"name": "Propaganda", "normalized_name": "propaganda", "description": "Information and fabricated narratives engineered to manipulate collective public belief.", "language": "en"},
    {"name": "Societal Collapse", "normalized_name": "societal collapse", "description": "The disintegration of human civilization, social contracts, and institutional order.", "language": "en"},
    
    # Sci-Fi & Speculative
    {"name": "Artificial Intelligence", "normalized_name": "artificial intelligence", "description": "Synthetic cognitive agents, robotic consciousness, and machine autonomy.", "language": "en"},
    {"name": "Space Exploration", "normalized_name": "space exploration", "description": "Interplanetary voyaging, discovery of alien worlds, and interstellar civilization.", "language": "en"},
    {"name": "Galactic Empire", "normalized_name": "galactic empire", "description": "Interstellar human dynasties, feudal space politics, and cosmic imperiums.", "language": "en"},
    {"name": "Cyberpunk", "normalized_name": "cyberpunk", "description": "High tech and low life, corporate dominance, cybernetic enhancement, and virtual networks.", "language": "en"},
    {"name": "Time Travel", "normalized_name": "time travel", "description": "Chronological displacement, temporal paradoxes, and non-linear timelines.", "language": "en"},
    {"name": "Alien Contact", "normalized_name": "alien contact", "description": "First encounters with extraterrestrial intelligence and cosmic mystery.", "language": "en"},

    # Philosophy & Ethics
    {"name": "Existentialism", "normalized_name": "existentialism", "description": "Individual freedom, responsibility, and the subjective struggle to forge personal meaning.", "language": "en"},
    {"name": "Absurdism", "normalized_name": "absurdism", "description": "The conflict between humanity's search for inherent purpose and the cold, silent universe.", "language": "en"},
    {"name": "Free Will", "normalized_name": "free will", "description": "The debate over autonomous human choice versus biological, mechanical, or causal determinism.", "language": "en"},
    {"name": "Ethics", "normalized_name": "ethics", "description": "Moral philosophies examining virtue, duty, justice, right, and wrong conduct.", "language": "en"},
    {"name": "Stoicism", "normalized_name": "stoicism", "description": "Endurance of hardship without complaint, inner resilience, and mastery of emotions.", "language": "en"},
    {"name": "Epistemology", "normalized_name": "epistemology", "description": "The philosophical inquiry into the nature, sources, validity, and limits of knowledge.", "language": "en"},
    {"name": "Morality", "normalized_name": "morality", "description": "Internal codes of conscience, moral responsibility, transgression, and guilt.", "language": "en"},

    # Psychology & Mind
    {"name": "Human Nature", "normalized_name": "human nature", "description": "Fundamental biological and psychological dispositions shared across humankind.", "language": "en"},
    {"name": "Habits", "normalized_name": "habits", "description": "Subconscious behavioral routines, atomic modifications, and long-term self-discipline.", "language": "en"},
    {"name": "Psychotherapy", "normalized_name": "psychotherapy", "description": "Clinical and conversational healing of psychological trauma, neurosis, and distress.", "language": "en"},
    {"name": "Cognitive Bias", "normalized_name": "cognitive bias", "description": "Systematic deviations from normative logic and rational decision making in human thought.", "language": "en"},
    {"name": "Mental Health", "normalized_name": "mental health", "description": "Psychological equilibrium, emotional resilience, and navigating inner turbulence.", "language": "en"},
    {"name": "Identity", "normalized_name": "identity", "description": "The evolving sense of personal selfhood, psychological integrity, and social persona.", "language": "en"},
    {"name": "Memory", "normalized_name": "memory", "description": "The persistence, distortion, nostalgia, and psychological burden of recalled past events.", "language": "en"},
    {"name": "Solitude", "normalized_name": "solitude", "description": "The experience of spiritual or existential isolation and introspective withdrawal.", "language": "en"},
    {"name": "Grief", "normalized_name": "grief", "description": "The profound emotional journey of mourning loss, sorrow, and bereavement.", "language": "en"},

    # Software Engineering & Tech Craft
    {"name": "Clean Code", "normalized_name": "clean code", "description": "Writing readable, maintainable, self-documenting, and testable computer code.", "language": "en"},
    {"name": "Software Architecture", "normalized_name": "software architecture", "description": "High-level design decisions, boundary encapsulation, and separation of concerns.", "language": "en"},
    {"name": "Refactoring", "normalized_name": "refactoring", "description": "Restructuring existing code without changing its external behavior to improve internal quality.", "language": "en"},
    {"name": "Domain-Driven Design", "normalized_name": "domain-driven design", "description": "Aligning software implementation directly with complex business mental models.", "language": "en"},
    {"name": "Agile Development", "normalized_name": "agile development", "description": "Iterative software engineering emphasizing adaptive planning and customer collaboration.", "language": "en"},
    {"name": "System Design", "normalized_name": "system design", "description": "Architecting resilient, distributed, scalable, and fault-tolerant software systems.", "language": "en"},

    # History, Society & Evolution
    {"name": "Civilization", "normalized_name": "civilization", "description": "The rise, structural complexity, accomplishments, and perils of human agrarian and urban societies.", "language": "en"},
    {"name": "Anthropology", "normalized_name": "anthropology", "description": "The comparative scientific study of human societies, cultures, and biological origins.", "language": "en"},
    {"name": "Evolutionary Biology", "normalized_name": "evolutionary biology", "description": "Natural selection, genetic adaptation, and the biological evolution of species.", "language": "en"},
    {"name": "Revolution", "normalized_name": "revolution", "description": "Radical political upheaval, societal transformation, and rebellion against established power.", "language": "en"},
    {"name": "Class Struggle", "normalized_name": "class struggle", "description": "Social stratification, economic friction, and inequality between social classes.", "language": "en"},

    # Business, Strategy & Productivity
    {"name": "Startup", "normalized_name": "startup", "description": "New business ventures designed for scalable innovation, rapid validation, and high growth.", "language": "en"},
    {"name": "Entrepreneurship", "normalized_name": "entrepreneurship", "description": "Creating and organizing new economic ventures while assuming financial and market risk.", "language": "en"},
    {"name": "Venture Capital", "normalized_name": "venture capital", "description": "Financing early-stage, high-potential startups and investing in disruptive technology.", "language": "en"},
    {"name": "Productivity", "normalized_name": "productivity", "description": "Optimizing personal efficiency, deep focus, intentional time management, and execution.", "language": "en"},
    {"name": "Leadership", "normalized_name": "leadership", "description": "Inspiring collective teams, making principled executive decisions, and fostering organizational culture.", "language": "en"},

    # Literary & Artistic Heritage
    {"name": "Magical Realism", "normalized_name": "magical realism", "description": "Literary style blending realistic worldviews with surreal, mythical, and fantastical elements.", "language": "en"},
    {"name": "Modernism", "normalized_name": "modernism", "description": "Avant-garde literary movement breaking from traditional forms through subjective experimentation.", "language": "en"},
    {"name": "Iranian History", "normalized_name": "iranian history", "description": "The cultural, dynastic, and sociopolitical evolution of the Iranian plateau across eras.", "language": "en"},
    {"name": "Persian Poetry", "normalized_name": "persian poetry", "description": "Rich verse tradition spanning Rumi, Hafez, Ferdowsi, Khayyam, and modernist bards.", "language": "en"},
    {"name": "Mysticism", "normalized_name": "mysticism", "description": "Spiritual experiences seeking direct, unmediated communion with ultimate transcendent reality.", "language": "en"},
]

def seed_taxonomies(stdout=None):
    created_genres = {}
    for g_data in CANONICAL_GENRES:
        genre, _ = Genre.objects.update_or_create(
            slug=g_data["slug"],
            defaults={
                "name": g_data["name"],
                "normalized_name": g_data["normalized_name"],
                "description": g_data["description"],
            },
        )
        created_genres[g_data["slug"]] = genre

    created_tags = {}
    for t_data in THEMATIC_TAGS:
        tag, _ = Tag.objects.update_or_create(
            normalized_name=t_data["normalized_name"],
            defaults={
                "name": t_data["name"],
                "description": t_data["description"],
                "language": t_data.get("language", "en"),
            },
        )
        created_tags[t_data["normalized_name"]] = tag

    if stdout:
        stdout.write(f"  ✓ Seeded {len(created_genres)} canonical genres and {len(created_tags)} thematic tags.")

    return created_genres, created_tags
