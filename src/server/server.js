import Hapi from '@hapi/hapi';
import routes from './routes.js';

const init = async () => {
    const server = Hapi.server({
        port: 3000,
        host: '0.0.0.0',
        routes: {
            cors: {
                origin: ['*'],
                credentials: true,
            },
        },
    });
    
    server.route(routes);

    try {
        await server.start();
        console.log('Server running on %s', server.info.uri);
    } catch (err) {
        console.error('Error starting server:', err);
        process.exit(1);
    }
};

process.on('unhandledRejection', (err) => {
    console.error(err);
    process.exit(1);
});

init();
