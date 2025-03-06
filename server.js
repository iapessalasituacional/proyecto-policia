const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mysql = require('mysql');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'policia_db'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Conectado a MySQL');
});

io.on('connection', (socket) => {
    // Actualizar resúmenes
    const actualizarResumen = () => {
        db.query('SELECT COUNT(*) as detenciones FROM detenciones WHERE DATE(fecha_registro) = CURDATE()', (err, det) => {
            db.query('SELECT COUNT(*) as siipol FROM verificaciones_siipol WHERE DATE(fecha_registro) = CURDATE()', (err, sii) => {
                db.query('SELECT COUNT(*) as accidentes FROM accidentes WHERE DATE(fecha_registro) = CURDATE()', (err, acc) => {
                    db.query('SELECT COUNT(*) as heridos FROM involucrados_accidentes WHERE estado = "herido" AND DATE(fecha_registro) = CURDATE()', (err, her) => {
                        db.query('SELECT COUNT(*) as fallecidos FROM involucrados_accidentes WHERE estado = "fallecido" AND DATE(fecha_registro) = CURDATE()', (err, fal) => {
                            socket.emit('actualizar', { 
                                detenciones: det[0].detenciones, 
                                siipol: sii[0].siipol, 
                                accidentes: acc[0].accidentes,
                                heridos: her[0].heridos,
                                fallecidos: fal[0].fallecidos 
                            });
                        });
                    });
                });
            });
        });
    };
    setInterval(actualizarResumen, 5000);
    actualizarResumen();

    // Guardar detención
    socket.on('nueva_detencion', (data) => {
        db.query('INSERT INTO detenciones (dia, hora, mes, anio, lugar_exacto, municipio, parroquia, cuadrante, latitud, longitud, nombre, apellido, cedula, lugar_residencia, delito, decomisos) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
            [data.dia, data.hora, data.mes, data.anio, data.lugar_exacto, data.municipio, data.parroquia, data.cuadrante, data.latitud, data.longitud, data.nombre, data.apellido, data.cedula, data.lugar_residencia, data.delito, data.decomisos], 
            (err) => { if (err) console.error(err); actualizarResumen(); }
        );
    });

    // Guardar verificación SIIPOL
    socket.on('nueva_verificacion', (data) => {
        db.query('INSERT INTO verificaciones_siipol (id_punto, tipo, cedula, nombre, placa, serial, resultado, dia, hora, mes, anio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
            [data.id_punto, data.tipo, data.cedula, data.nombre, data.placa, data.serial, data.resultado, data.dia, data.hora, data.mes, data.anio], 
            (err) => { if (err) console.error(err); actualizarResumen(); }
        );
    });

    // Guardar accidente
    socket.on('nuevo_accidente', (data) => {
        db.query('INSERT INTO accidentes (dia, hora, mes, anio, lugar_exacto, municipio, parroquia, latitud, longitud, tipo_transporte) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
            [data.dia, data.hora, data.mes, data.anio, data.lugar_exacto, data.municipio, data.parroquia, data.latitud, data.longitud, data.tipo_transporte], 
            (err, result) => { 
                if (err) console.error(err); 
                socket.emit('accidente_guardado', { id: result.insertId });
                actualizarResumen(); 
            }
        );
    });

    // Guardar involucrado
    socket.on('nuevo_involucrado', (data) => {
        db.query('INSERT INTO involucrados_accidentes (id_accidente, nombre, apellido, cedula, genero, edad, estado, lesiones) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
            [data.id_accidente, data.nombre, data.apellido, data.cedula, data.genero, data.edad, data.estado, data.lesiones], 
            (err) => { if (err) console.error(err); actualizarResumen(); }
        );
    });

    // Reporte semanal SIIPOL
    socket.on('reporte_semanal', () => {
        db.query('SELECT p.nombre, COUNT(*) as total FROM verificaciones_siipol v JOIN puntos_control p ON v.id_punto = p.id_punto WHERE DATE(fecha_registro) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) GROUP BY p.id_punto, p.nombre', 
            (err, results) => {
                if (err) throw err;
                socket.emit('reporte_semanal', results);
            });
    });

    // Reporte semanal Accidentes
    socket.on('reporte_accidentes_semanal', () => {
        db.query('SELECT tipo_transporte, COUNT(*) as total FROM accidentes WHERE DATE(fecha_registro) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) GROUP BY tipo_transporte', 
            (err, results) => {
                if (err) throw err;
                socket.emit('reporte_accidentes_semanal', results);
            });
    });
});

server.listen(3000, () => console.log('Servidor en http://localhost:3000'));
