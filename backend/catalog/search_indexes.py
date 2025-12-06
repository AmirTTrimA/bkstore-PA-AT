from haystack import indexes

from .models import Author, Book


class BookIndex(indexes.SearchIndex, indexes.Indexable):
    """
    Defines what fields from the Book model will be indexed in Solr.
    The 'text' field combines content for full-text search relevance.
    """

    # 🔑 REQUIRED: This is the primary field Solr searches against.
    # use_template=True tells Haystack to use the book_text.txt file.
    text = indexes.CharField(document=True, use_template=True)

    # Fields used for display, filtering, and boosting relevance:
    title = indexes.CharField(model_attr="title", faceted=True)
    author_name = indexes.CharField(
        model_attr="author__name", boost=1.5
    )  # Boost author name relevance
    isbn = indexes.CharField(model_attr="isbn")
    genre = indexes.CharField(model_attr="genre")

    def get_model(self):
        """Returns the model that this index should target."""
        return Book


class AuthorIndex(indexes.SearchIndex, indexes.Indexable):
    """
    Defines what fields from the Author model will be indexed in Solr.
    """

    text = indexes.CharField(document=True, use_template=True)
    name = indexes.CharField(
        model_attr="name", boost=2.0
    )  # High boost for author name search
    biography = indexes.CharField(model_attr="biography")

    def get_model(self):
        return Author
