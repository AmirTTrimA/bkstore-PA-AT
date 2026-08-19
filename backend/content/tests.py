from catalog.models import Author, Book, BookFormat
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import License

User = get_user_model()


class LicenseListViewTest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username="license_user",
            password="testpass123",
        )

        cls.other_user = User.objects.create_user(
            username="other_license_user",
            password="testpass123",
        )

        cls.author = Author.objects.create(
            name="License Test Author",
        )

        cls.digital_book = Book.objects.create(
            author=cls.author,
            title="Digital Test Book",
            slug="digital-test-book",
            isbn="9780000000001",
            description="Digital test book",
            genre="TECH",
            is_digital=True,
        )

        cls.audio_book = Book.objects.create(
            author=cls.author,
            title="Audio Test Book",
            slug="audio-test-book",
            isbn="9780000000002",
            description="Audio test book",
            genre="TECH",
            is_audio=True,
        )

        cls.digital_format = BookFormat.objects.create(
            book=cls.digital_book,
            format_type=BookFormat.FormatType.DIGITAL,
        )

        cls.audio_format = BookFormat.objects.create(
            book=cls.audio_book,
            format_type=BookFormat.FormatType.AUDIO,
        )

        cls.digital_license = License.objects.create(
            user=cls.user,
            book=cls.digital_book,
            book_format=cls.digital_format,
        )

        cls.audio_license = License.objects.create(
            user=cls.user,
            book=cls.audio_book,
            book_format=cls.audio_format,
        )

        cls.other_license = License.objects.create(
            user=cls.other_user,
            book=cls.digital_book,
            book_format=cls.digital_format,
        )

    def setUp(self):
        self.url = "/api/v1/content/licenses/"

    def test_authenticated_user_can_list_own_licenses(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        results = response.data["results"]

        returned_ids = {
            item["id"]
            for item in results
        }

        self.assertIn(
            self.digital_license.id,
            returned_ids,
        )

        self.assertIn(
            self.audio_license.id,
            returned_ids,
        )

        self.assertNotIn(
            self.other_license.id,
            returned_ids,
        )

    def test_user_cannot_see_other_users_licenses(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url)

        results = response.data["results"]

        returned_ids = {
            item["id"]
            for item in results
        }

        self.assertNotIn(
            self.other_license.id,
            returned_ids,
        )

        self.assertTrue(
            all(
                item["id"] != self.other_license.id
                for item in results
            )
        )

    def test_license_contains_format_information(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url)

        results = response.data["results"]

        licenses_by_id = {
            item["id"]: item
            for item in results
        }

        digital = licenses_by_id[self.digital_license.id]
        audio = licenses_by_id[self.audio_license.id]

        self.assertEqual(
            digital["book_id"],
            self.digital_book.id,
        )

        self.assertEqual(
            digital["book_title"],
            self.digital_book.title,
        )

        self.assertEqual(
            digital["book_slug"],
            self.digital_book.slug,
        )

        self.assertEqual(
            digital["book_format_id"],
            self.digital_format.id,
        )

        self.assertEqual(
            digital["format_type"],
            BookFormat.FormatType.DIGITAL,
        )

        self.assertEqual(
            digital["format_name"],
            "Digital",
        )

        self.assertEqual(
            audio["format_type"],
            BookFormat.FormatType.AUDIO,
        )

        self.assertEqual(
            audio["format_name"],
            "Audio",
        )

    def test_anonymous_user_cannot_list_licenses(self):
        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_user_with_no_licenses_gets_empty_list(self):
        user = User.objects.create_user(
            username="empty_license_user",
            password="testpass123",
        )

        self.client.force_authenticate(user=user)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["count"],
            0,
        )

        self.assertEqual(
            response.data["results"],
            [],
        )