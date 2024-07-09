const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot');
const axios = require('axios');
const QRPortalWeb = require('@bot-whatsapp/portal');
const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const MockAdapter = require('@bot-whatsapp/database/mock');

let GLOBAL_STATE = {};

const galileo = (datosEntrantantes, callback) => {
    var config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'http://192.168.15.123:11434/api/generate',
        headers: { 
            'Content-Type': 'application/json'
        },
        data: JSON.stringify(datosEntrantantes)
    };
    axios.request(config)
        .then((response) => {
            console.log(JSON.stringify(response.data));
            callback(null, response.data); // Llamar al callback con la respuesta de la API
        })
        .catch((error) => {
            console.log(error);
            callback(error); // Llamar al callback con el error
        });
};

const gpt = addKeyword('hola').addAnswer("Hola, soy RinoTikect, tu asistente virtual. ¿Quieres consultar?", 
{ capture: true },
async (ctx, { flowDynamic }) => {
    GLOBAL_STATE[ctx.from] = {
        "model": "llama3:latest",
        "stream": false,
        "prompt": ctx.body,
    };

    galileo(GLOBAL_STATE[ctx.from], async (err, response) => {
        if (err) {
            await flowDynamic([{ body: "Hubo un error al procesar tu solicitud. Inténtalo de nuevo más tarde." }]);
        } else {
            await flowDynamic([{ body: `Respuesta de la API: ${JSON.stringify(response, null, 2)}` }]);
        }
    });
});

const main = async () => {                                                                                                                     
    const adapterDB = new MockAdapter();
    const adapterFlow = createFlow([gpt]); // Aca puedes agregar más flujos de conversación
    const adapterProvider = createProvider(BaileysProvider);

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });

    QRPortalWeb();
};

main();
