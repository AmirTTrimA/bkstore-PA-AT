from django.db import migrations


def create_formats(apps, schema_editor):
    Book = apps.get_model("catalog", "Book")
    BookFormat = apps.get_model("catalog", "BookFormat")

    for book in Book.objects.all():
        created_any = False

        if getattr(book, "is_digital", False):
            BookFormat.objects.get_or_create(
                book=book,
                format_type="DIGITAL",
            )
            created_any = True

        if getattr(book, "is_audio", False):
            BookFormat.objects.get_or_create(
                book=book,
                format_type="AUDIO",
            )
            created_any = True

        if not created_any:
            BookFormat.objects.get_or_create(
                book=book,
                format_type="PHYSICAL",
            )


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0003_bookformat"),
    ]

    operations = [
        migrations.RunPython(create_formats, migrations.RunPython.noop),
    ]