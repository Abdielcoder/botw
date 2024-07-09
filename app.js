require('dotenv').config();
const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot');
const axios = require('axios');
const QRPortalWeb = require('@bot-whatsapp/portal');
const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const MockAdapter = require('@bot-whatsapp/database/mock');
const { getPermittedPhoneNumbers } = require('./db');

// ID del agente constante
const AGENT_ID = 10;

// Funciones para interactuar con el API
const consultarTicketPorId = async (ticketId) => {
    const config = {
        method: 'get',
        url: `https://erp.rinorisk.com/api/tickets/${ticketId}/details`,
        headers: {
            'Cookie': `session_id=${process.env.SESSION_ID}`
        }
    };

    try {
        const response = await axios.request(config);
        return response.data;
    } catch (error) {
        console.error(error);
        return null;
    }
};

const insertarComentarioEnTicket = async (ticketId, comment) => {
    const data = JSON.stringify({
        "ticketId": parseInt(ticketId, 10), // Convertir ticketId a entero
        "agentId": AGENT_ID, // ID del agente constante
        "comment": comment
    });

    const config = {
        method: 'post',
        url: `https://erp.rinorisk.com/api/tickets/${ticketId}/comments`,
        headers: {
            'Content-Type': 'application/json',
            'Cookie': `session_id=${process.env.SESSION_ID}`
        },
        data: data
    };

    try {
        const response = await axios.request(config);
        console.log('Response data:', response.data); // Añadido console.log para éxito
        return response.data;
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message); // Añadido console.log para error
        return null;
    }
};

// Flujos del bot
const flowConsultarTicket = addKeyword(['t', 'ticket'])
    .addAnswer('Por favor, proporciona el ID del ticket:', { capture: true }, async (ctx, { flowDynamic }) => {
        const ticketId = ctx.body;
        const ticketDetails = await consultarTicketPorId(ticketId);
        if (ticketDetails && ticketDetails.status) {
            const { status, description, assigned_executive, observations } = ticketDetails;

            let responseText = `
Estado: ${status}
Descripción: ${description || 'No hay descripción disponible'}

Ejecutivo Asignado:
- ID: ${assigned_executive.id}
- Nombre: ${assigned_executive.name}
- Email: ${assigned_executive.email}`;

            if (observations && observations.length > 0) {
                const lastObservation = observations[observations.length - 1];
                responseText += `
                
Última Observación:
- ID: ${lastObservation.id}
- Nombre: ${lastObservation.name}
- Agente: ${lastObservation.agent}
- Fecha: ${lastObservation.date}`;
            }

            await flowDynamic(responseText);
        } else {
            await flowDynamic(`No se pudo encontrar el ticket con ID ${ticketId}.`);
        }
    });

const flowComentarTicket = addKeyword(['c','comentar'])
    .addAnswer('Por favor, proporciona el ID del ticket y tu comentario en el siguiente formato: ID_ticket, comentario', { capture: true }, async (ctx, { flowDynamic }) => {
        const [ticketId, ...commentParts] = ctx.body.split(',');
        const comment = commentParts.join(',').trim();
        const ticketDetails = await consultarTicketPorId(ticketId.trim());
        if (ticketDetails && ticketDetails.status) {
            const response = await insertarComentarioEnTicket(ticketId.trim(), comment);
            if (response) {
                await flowDynamic('Comentario recibido. Ahora te muestro tu ticket actualizado.');
                const updatedTicketDetails = await consultarTicketPorId(ticketId.trim());
                if (updatedTicketDetails && updatedTicketDetails.status) {
                    const { status, description, assigned_executive, observations } = updatedTicketDetails;

                    let responseText = `
Estado: ${status}
Descripción: ${description || 'No hay descripción disponible'}

Ejecutivo Asignado:
- ID: ${assigned_executive.id}
- Nombre: ${assigned_executive.name}
- Email: ${assigned_executive.email}`;

                    if (observations && observations.length > 0) {
                        const lastObservation = observations[observations.length - 1];
                        responseText += `
                        
Última Observación:
- ID: ${lastObservation.id}
- Nombre: ${lastObservation.name}
- Agente: ${lastObservation.agent}
- Fecha: ${lastObservation.date}`;
                    }

                    await flowDynamic(responseText);
                } else {
                    await flowDynamic('No se pudo encontrar el ticket actualizado.');
                }
            } else {
                await flowDynamic('No se pudo insertar el comentario. Inténtalo de nuevo.');
            }
        } else {
            await flowDynamic(`No se pudo encontrar el ticket con ID ${ticketId}. No se puede agregar un comentario.`);
        }

        await flowDynamic('Escribe la palabra "menu" para ver las opciones disponibles.');
    });

const flowPrincipal = addKeyword(['menu', 'inicio', 'start','hola'])
.addAnswer('👱‍♀️ Hola, soy ARIS, tu asistente virtual. A continuación, te muestro las opciones disponibles por el momento: ✔')
    .addAnswer('📋 Menú de opciones:\n1. 🔖 Consultar ticket por ID\n2. 🖊️Insertar comentario en ticket por ID\nEscribe el número o la letra clave, *"t" o  "c"*');

const main = async () => {
    const adapterDB = new MockAdapter();
    const adapterFlow = createFlow([flowPrincipal, flowConsultarTicket, flowComentarTicket]);
    const adapterProvider = createProvider(BaileysProvider);
    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });
    QRPortalWeb(); // Iniciar el portal QR para autenticación
};

main();
