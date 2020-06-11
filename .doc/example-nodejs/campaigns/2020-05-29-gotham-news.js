const fs = require('fs');
const csv = require('csv-parser');
const uuid = require('uuid/v4');
const Sender = require('./sender');
const {log, trim} = require('./utils');

const subject = "🚩 Gotham news 2020";
const filePath = './resources/people-of-gotham.csv';
const sqlFileLog = './tmp/email_log.sql';

function sendMail(id, name, email, locale)
{
    let mail = new Sender();
    mail.setToWithName(name, email);
    mail.setMalaPokladna();
    mail.setText(subject);
    mail.setSubject(subject);
    mail.setTemplate({
        name: "billing_" + locale,
        variables: {
            shared_email_header_link_hp: "https://gotham.ccom",
        }
    });

    mail.send(function (error, body)
    {
        console.log("response:", body);
        console.log("error:", error);

        if (false !== error) {
            console.error(error);
        }
        else
        {
            log(sqlFileLog, "('" + uuid() + "', '" + id + "', '" + email + "', '" + subject + "', '" + tpl + "', now()),\n");
        }
    })
}

log(sqlFileLog, 'INSERT INTO "user_email_log" ("uuid_id", "user_id", "email", "subject", "template", "date_sent") VALUES \n');

fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', function(data)
    {
        try {
            // get data
            let id = data["id"];
            let name = trim(data["name"]);
            let email = trim(data["email"]);
            let locale = trim(data["locale"]);

            // fire
            setTimeout(()=> {
                sendMail(id, name, email, locale);
            },3000);
        }
        catch(err) {
            console.error('!!! Problem with row !!!', err)
        }
    });