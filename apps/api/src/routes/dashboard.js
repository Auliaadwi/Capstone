import { Router } from "express";
import { dashboardSnapshot } from "../data/mockData.js";

const router = Router();

router.get("/overview", (_req, res) => {
  return res.json(dashboardSnapshot);
});

router.get("/:userId", (req, res) => {
  return res.json({
    ...dashboardSnapshot,
    user: {
      ...dashboardSnapshot.user,
      id: req.params.userId
    }
  });
});

export default router;
