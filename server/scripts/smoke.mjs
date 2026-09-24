import { io } from 'socket.io-client';

const url = 'http://localhost:3000';
const a = io(url);
const b = io(url);

a.on('room-joined', (d) => console.log('A joined', d));
a.on('peer-joined', (d) => console.log('A sees peer-joined', d));
a.on('offer', (d) => {
  console.log('A got offer from', d.from);
  a.emit('answer', { to: d.from, sdp: { type: 'answer', sdp: 'fake' } });
});

b.on('room-joined', (d) => {
  console.log('B joined', d);
  b.emit('offer', { to: d.peers[0], sdp: { type: 'offer', sdp: 'fake' } });
});
b.on('answer', (d) => {
  console.log('B got answer from', d.from);
  a.close();
  b.close();
});

a.on('connect', () => {
  a.emit('join-room', { roomId: 'test' });
  setTimeout(() => b.emit('join-room', { roomId: 'test' }), 300);
});