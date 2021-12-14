const Sender = require('../sender');

function SendAnonymousPaymentSuccess() {
    let mail = new Sender();
    mail.setToWithName("John Doe", "john@doe.com");
    mail.setMalaPokladna();
    mail.setText("Hello");
    mail.setSubject("Test");
    mail.setTemplate({
        name: "billing_en",
        variables: {
            "subject": "test_subject",
            "amount": "test_amount",
            "venueName": "test_venueName",
            "transactionCode": "test_transactionCode",
            "dateOfPayment": "test_dateOfPayment",
            "variableSymbol": "false",
            "note": "false"
        }
    });

    mail.send((error, body) =>
    {
        if (error) {
            console.error(error);
        }
        console.log("response:", body);
    })
}

SendAnonymousPaymentSuccess();
