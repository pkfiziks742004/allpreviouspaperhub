const clients = new Set();

const subscribeSettingsEvents = res => {
  clients.add(res);
  return () => clients.delete(res);
};

const emitSettingsChanged = () => {
  const payload = `data: ${JSON.stringify({ type: "settings-updated", at: Date.now() })}\n\n`;
  for (const res of clients) {
    try {
      res.write(payload);
    } catch (err) {
      clients.delete(res);
    }
  }
};

module.exports = {
  subscribeSettingsEvents,
  emitSettingsChanged
};

