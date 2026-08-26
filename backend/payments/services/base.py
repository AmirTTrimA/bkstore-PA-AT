class PaymentGateway:

    def request_payment(self, payment):
        raise NotImplementedError

    def verify_payment(self, payment, callback_data):
        raise NotImplementedError