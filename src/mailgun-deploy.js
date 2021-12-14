const fs = require('fs');
const path = require('path');
const glob = require('glob');
const fm = require('front-matter');
const axios = require('axios');
const qs = require('qs');
const dotenv = require('dotenv');
dotenv.config();


const sourceTemplates = process.env.SOURCE || path.join(__dirname, 'templates', '/**/!(_*).html');


const axiosInstance = axios.create({
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
    },
    auth: {
        username: 'api',
        password: process.env.MAILGUN_API_KEY
    },
})

function deploy() {
    const diskPages = glob.sync(sourceTemplates);

    const tagName = process.argv[2].replace(':devHash', `localhost-${new Date().getTime()}`) // take argument from CLI / CommitID


    const totalFiles = diskPages.length;

    let updatedTemplates = 0;
    let createdTemplates = 0;
    let canBeUploaded = 0;

    let processedTotal = 0;

    diskPages.forEach(filePath => {
        fs.readFile(filePath, 'utf-8', (error, data) => {
            const config = fm(data);
            const splitName = filePath.split('/')
            const fileName = splitName[splitName.length - 1].replace('.html', '')
            let mailgunDomain = config.attributes.mailgunDomain;
            let mailgunAPI = config.attributes.mailgunAPI;


            if (mailgunDomain) {
                canBeUploaded++;
                const buildFilePath = path.join(__dirname, 'build', filePath.split('templates/')[1]);
                fs.readFile(buildFilePath, 'utf-8', async (error, data) => {

                    let templateExists = false;
                    const baseURL = mailgunAPI === 'eu' ? 'https://api.eu.mailgun.net/v3' : 'https://api.mailgun.net/v3'

                    try {
                        let versionsData = (await axiosInstance.get(`${baseURL}/${mailgunDomain}/templates/${fileName}/versions`)).data
                        let versions = versionsData.template.versions;
                        templateExists = true;

                        if (versions.length >= 10) {
                            const oldestVersion = versions[0].tag
                            try {
                                await axiosInstance.delete(`${baseURL}/${mailgunDomain}/templates/${fileName}/versions/${oldestVersion}`)
                            } catch (e) {
                                console.log(e);
                            }
                        }

                    } catch (e) {
                        if (e.response.data.message === 'template not found') templateExists = false;
                    }


                    if (templateExists) {
                        try {
                            let response = await axiosInstance.post(`${baseURL}/${mailgunDomain}/templates/${fileName}/versions`, qs.stringify({
                                template: data,
                                tag: tagName,
                                active: 'yes'
                            }))
                            console.info(`Updated template: ${fileName}, message: ${response.data.message}`)
                            updatedTemplates++;
                        } catch (e) {
                            console.log(`Error with updating template: ${fileName}, message: ${e.response.data.message}`);
                        } finally {
                            processedTotal++;
                        }

                    } else {
                        try {
                            let response = await axiosInstance.post(`${baseURL}/${mailgunDomain}/templates`, qs.stringify({
                                template: data,
                                name: fileName,
                                tag: tagName,
                            }))
                            createdTemplates++;
                            console.info(`Created template: ${fileName}, message: ${response.data.message}`)
                        } catch (e) {
                            console.log(`Error with creating template: ${fileName}, message: ${e.response.data.message}`);
                        } finally {
                            processedTotal++;
                        }

                    }
                    if (processedTotal === canBeUploaded) {
                        const successChar = updatedTemplates + createdTemplates === canBeUploaded ? '✔' : 'X'
                        console.log(`\n[${successChar}] Updated ${updatedTemplates} and created ${createdTemplates} templates out of ${canBeUploaded} [${totalFiles}]`)
                    }

                })
            }
        })
    })

}


deploy()
