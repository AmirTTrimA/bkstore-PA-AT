from django.db import migrations


def attach_prices_to_formats(apps, schema_editor):
    Price = apps.get_model("pricing", "Price")
    BookFormat = apps.get_model("catalog", "BookFormat")

    for price in Price.objects.select_related("book"):
        book = price.book

        # Prefer physical format as the default sellable edition
        format_obj = BookFormat.objects.filter(
            book=book,
            format_type="PHYSICAL",
        ).first()

        # Fallback to the first available format
        if format_obj is None:
            format_obj = BookFormat.objects.filter(book=book).first()

        if format_obj is not None:
            price.book_format = format_obj
            price.save(update_fields=["book_format"])


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0004_seed_book_formats"),
        ("pricing", "0006_price_book_format"),
    ]

    operations = [
        migrations.RunPython(attach_prices_to_formats, migrations.RunPython.noop),
    ]