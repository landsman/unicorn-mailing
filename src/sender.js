const emailConfig = require('./sender-config')();
const unirest = require('unirest');

class Sender
{
    constructor()
    {
        this._status = null;
        this.status_dev = 'dev';
        this.status_prod = 'prod';

        this._from = null;
        this._to = null;
        this._bcc = null;
        this._subject = null;
        this._text = null;
        this._html = " ";
        this._template = {
            name: null,
            variables: {},
        };
        this._tag = null;

        if(emailConfig.status !== this.status_dev && emailConfig.status !== this.status_prod) {
            throw new Error('Unknown status for run or not defined in ENV file!');
        }

        this._status = emailConfig.status;
    }

    setFrom(mail) {
        this._from = mail;
    }

    setTo(mail) {
        this._to = mail;
    }

    setToWithName(name, email) {
        this._to = name + ' <' + email + '>';
    }

    setBcc(mail) {
        this._bcc = mail;
    }

    setSubject(text) {
        this._subject = text;
    }

    setText(text) {
        this._text = text;
    }

    setTemplate(tpl) {
        if(!(tpl instanceof Object)){
            console.error("template have to be object");
            return;
        }

        if(!tpl.hasOwnProperty("name")){
            console.error("template have to defined name property");
            return;
        }

        if(!tpl.hasOwnProperty("variables")){
            console.error("template have to defined variables");
            return;
        }

        if(Object.keys(tpl.variables).length === 0){
            console.error("template have to have defined some variables always");
            return;
        }

        this._template = tpl;
    }

    setTag(tag) {
        this._tag = tag;
    }

    //
    // setup email for malapokladna merchants
    //
    setMalaPokladna() {
        this._from = emailConfig.fromMP;
        this._bcc = emailConfig.loggerMP;
        this._tag = "MalaPokladna";
    }

    isDevMode(){
        return this.status_dev === this._status;
    }

    //
    // override receiver in DEV mode
    //
    getReceiver() {
        return this.isDevMode() ? emailConfig.devMail : this._to;
    }

    async send(callback)
    {
        if(this.isDevMode())
        {
            let prefix = 'DEV - to: ' + this._to;
            this._subject = prefix + ' |' + this._subject;
        }

        await unirest
            .post("https://api.mailgun.net/v3/" + emailConfig.domain + "/messages")
            .auth({
                user: "api",
                pass: emailConfig.apiKey,
            })
            .field("from", this._from)
            .field("to", this.getReceiver())
            .field("bcc", this._bcc)
            .field("subject", this._subject)
            .field("text", this._text)
            .field("template", this._template.name)
            .field("h:X-Mailgun-Variables", JSON.stringify(this._template.variables))
            .field("tag", this._tag)
            .end((response) => {
                callback(response.error, response.body)
            });
    }
}

module.exports = Sender;
