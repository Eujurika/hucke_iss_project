import { Router } from 'express';
import { issPositionAction, issPassesAction } from './controller.js';

const router = Router();

router.get('/iss-position', issPositionAction);
router.get('/iss-passes', issPassesAction);

export { router };
