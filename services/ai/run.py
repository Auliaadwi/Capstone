from __future__ import annotations

import os

from app import app


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5001"))
    debug = os.getenv("FLASK_DEBUG", "true").lower() in {"1", "true", "yes"}
    app.run(host="0.0.0.0", port=port, debug=debug)
