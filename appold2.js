require('dotenv').config();
const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot');
const QRPortalWeb = require('@bot-whatsapp/portal');
const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const MockAdapter = require('@bot-whatsapp/database/mock');

const flowPrincipal = addKeyword('hola')
    .addAnswer(
        '👍Hola gracias por Escanear el QR tenemos una promocion🎉 especial para ti!!.'
    )
    .addAnswer(
        'Revisa nuestra tarjeta', { media: 'https://centromedicopremier.com/wp-content/uploads/2024/02/Diseno-sin-titulo-2.png' }
    )
    .addAnswer(
        'consulta nuestras alianzas', { media: 'https://rinokey.com/rinodocumentos/rinomania.pdf' }
    )
    .addAnswer(
        'Te dejo este pequeño video', { media: 'https://rinokey.com/rinodocumentos/premier.mp4' }
    );
    

const main = async () => {
    const adapterDB = new MockAdapter();
    const adapterProvider = createProvider(BaileysProvider);

    const adapterFlow = createFlow([flowPrincipal]);

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });

    QRPortalWeb();
};

main();