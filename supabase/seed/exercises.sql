-- ExecVoice exercise seed (42 rows)
-- Idempotent: clears library then re-inserts (safe for empty / seed-only tables).

-- Prefer DELETE over TRUNCATE … CASCADE so sessions that reference
-- exercises keep their rows (FK is ON DELETE SET NULL).
delete from public.exercises;

insert into public.exercises
  (type, title, prompt, duration_s, prep_s, difficulty, language, tips)
values
  ('impromptu', 'Priorité du trimestre', 'On vous demande à brûle-pourpoint : quelle est la priorité n°1 de votre équipe ce trimestre, et pourquoi ? Structurez en 3 points.', 90, 60, 2, 'fr', 'Ouvrez par la conclusion, puis justifiez.'),
  ('impromptu', 'Risque imprévu', 'Un risque majeur vient d''émerger sur votre projet. En 90 secondes, expliquez le risque, l''impact et votre plan de mitigation.', 90, 60, 3, 'fr', 'Restez factuel : risque → impact → action.'),
  ('impromptu', 'Décision sous contrainte', 'Vous devez trancher entre deux options budgétaires contradictoires. Présentez votre décision et vos critères en 90 secondes.', 90, 60, 3, 'fr', 'Nommez clairement le trade-off.'),
  ('impromptu', 'Feedback difficile', 'Un collaborateur senior a manqué une échéance critique. Préparez 60 s, puis donnez le feedback oral en 90 s.', 90, 60, 4, 'fr', 'Fait → Impact → Attente → Soutien.'),
  ('impromptu', 'Quarter priority', 'Cold call: what is your team''s #1 priority this quarter, and why? Structure your answer in three points.', 90, 60, 2, 'en', 'Lead with the conclusion, then justify.'),
  ('impromptu', 'Emerging risk', 'A major risk just surfaced on your project. In 90 seconds, explain the risk, impact, and mitigation plan.', 90, 60, 3, 'en', 'Stay factual: risk → impact → action.'),
  ('impromptu', 'Constrained decision', 'You must choose between two conflicting budget options. Present your decision and criteria in 90 seconds.', 90, 60, 3, 'en', 'Name the trade-off explicitly.'),
  ('pitch', 'Pitch produit — conclusion d''abord', 'Résumez votre produit / initiative en 30 secondes avec PREP : Point → Reason → Example → Point. Commencez par la conclusion.', 30, 30, 2, 'fr', 'Première phrase = le « so what » business.'),
  ('pitch', 'Elevator pitch investisseurs', 'Vous croisez un investisseur dans un ascenseur. Pitch de 30 s : problème, solution, traction, ask.', 30, 45, 3, 'fr', 'Un seul chiffre mémorable suffit.'),
  ('pitch', 'Synthèse comex', 'Le DG vous demande un résumé de 30 s de votre slide deck. Appliquez le Pyramid Principle.', 30, 30, 3, 'fr', 'Réponse → 2 arguments → preuve.'),
  ('pitch', 'Annonce de changement', 'Annoncez une réorganisation d''équipe en 30 secondes : décision, raison, prochaine étape.', 30, 30, 4, 'fr', 'Ton calme, phrases courtes, zéro jargon.'),
  ('pitch', 'Product pitch — answer first', 'Summarize your product/initiative in 30 seconds using PREP: Point → Reason → Example → Point. Lead with the conclusion.', 30, 30, 2, 'en', 'First sentence = the business ''so what''.'),
  ('pitch', 'Investor elevator pitch', 'You meet an investor in an elevator. 30-second pitch: problem, solution, traction, ask.', 30, 45, 3, 'en', 'One memorable metric is enough.'),
  ('pitch', 'Exec summary', 'Your CEO wants a 30-second summary of your deck. Apply the Pyramid Principle.', 30, 30, 3, 'en', 'Answer → 2 arguments → proof.'),
  ('board_qa', 'Pourquoi ce budget ?', 'Question board : « Pourquoi demander 20 % de budget supplémentaire alors que le ROI n''est pas encore prouvé ? » Répondez en 45 s max.', 45, 20, 4, 'fr', 'Reconnaissez le point, puis ancrez sur les données.'),
  ('board_qa', 'Échec de lancement', '« Votre dernier lancement a sous-performé de 30 %. Que s''est-il passé et que changez-vous ? » 45 s max.', 45, 20, 4, 'fr', 'Ownership d''abord, excuses ensuite, plan clair.'),
  ('board_qa', 'Concurrence agressive', '« Un concurrent vient de baisser ses prix de 40 %. Quelle est votre réponse stratégique ? » 45 s.', 45, 20, 3, 'fr', 'Ne réagissez pas émotionnellement ; cadrez la différenciation.'),
  ('board_qa', 'Risque réglementaire', '« Comment gérez-vous le risque réglementaire sur ce marché ? » Réponse board en 45 s.', 45, 20, 3, 'fr', 'Cadre → contrôles → propriétaire du risque.'),
  ('board_qa', 'Why this budget?', 'Board question: ''Why ask for 20% more budget when ROI isn''t proven yet?'' Answer in 45s max.', 45, 20, 4, 'en', 'Acknowledge the concern, then anchor on data.'),
  ('board_qa', 'Missed launch', '''Your last launch underperformed by 30%. What happened and what changes?'' 45s max.', 45, 20, 4, 'en', 'Ownership first, then a clear plan.'),
  ('board_qa', 'Aggressive competitor', '''A competitor just cut prices by 40%. What''s your strategic response?'' 45s.', 45, 20, 3, 'en', 'Don''t react emotionally; frame differentiation.'),
  ('storytelling', 'Décision difficile en 3 actes', 'Racontez une décision difficile en 3 actes (contexte / tension / résolution). 2 minutes max. Terminez par l''apprentissage.', 120, 45, 3, 'fr', 'Un personnage, un conflit, une leçon.'),
  ('storytelling', 'Le moment où j''ai changé d''avis', 'Racontez un moment où une donnée vous a fait changer de stratégie. Structure : avant → insight → après.', 90, 40, 2, 'fr', 'Montrez l''humilité intellectuelle, pas l''échec.'),
  ('storytelling', 'Victoire d''équipe', 'Racontez une victoire collective en mettant en avant le rôle des autres, pas le vôtre. 90 s.', 90, 30, 2, 'fr', 'Les leaders créditent ; ils ne se mettent pas au centre.'),
  ('storytelling', 'Crise gérée', 'Racontez comment vous avez géré une crise client ou produit. 3 actes, 2 minutes.', 120, 45, 4, 'fr', 'Tension palpable, résolution nette, leçon actionnable.'),
  ('storytelling', 'Hard decision in 3 acts', 'Tell a hard decision story in 3 acts (context / tension / resolution). 2 minutes max. End with the lesson.', 120, 45, 3, 'en', 'One character, one conflict, one lesson.'),
  ('storytelling', 'When data changed my mind', 'Tell a moment when data made you change strategy. Structure: before → insight → after.', 90, 40, 2, 'en', 'Show intellectual humility, not failure.'),
  ('storytelling', 'Team win', 'Tell a collective win while elevating others, not yourself. 90s.', 90, 30, 2, 'en', 'Leaders credit; they don''t center themselves.'),
  ('articulation', 'Virelangue exécutif', 'Lisez à voix haute, clairement, à ~140 mots/min : « Six sociétés stratégiques surveillent sans cesse les cycles successifs de croissance. » Répétez 3 fois, puis paraphrasez le sens en une phrase CEO.', 60, 15, 2, 'fr', 'Articulez les sibilantes ; posez-vous entre les groupes.'),
  ('articulation', 'Lecture chiffrée', 'Lisez ce briefing à voix haute : « Le CA a progressé de 12,4 % à 48,7 M€, avec une marge EBITDA de 18,2 % et un churn réduit de 230 points de base. » Puis reformulez sans jargon.', 60, 20, 3, 'fr', 'Les chiffres se disent lentement, une pause après chaque.'),
  ('articulation', 'Rythme et silences', 'Prononcez 4 phrases clés sur votre vision. Insérez un silence d''1 seconde après chaque phrase. Objectif : rythme posé, 130–150 mots/min.', 75, 30, 3, 'fr', 'Le silence = autorité. Ne le comblez pas.'),
  ('articulation', 'Éliminer les tics', 'Présentez votre rôle en 60 s sans aucun « euh », « du coup », « en fait », « voilà ». Si vous hésitez, silence plutôt que tic.', 60, 20, 4, 'fr', 'Ralentissez volontairement de 10 %.'),
  ('articulation', 'Executive tongue twister', 'Read clearly at ~140 wpm: ''Strategic stakeholders steadily scrutinize successive cycles of scalable growth.'' Repeat 3 times, then paraphrase in one CEO sentence.', 60, 15, 2, 'en', 'Hit the sibilants; pause between thought groups.'),
  ('articulation', 'Numbers aloud', 'Read this briefing aloud: ''Revenue grew 12.4% to $48.7M, with 18.2% EBITDA margin and churn down 230 basis points.'' Then restate without jargon.', 60, 20, 3, 'en', 'Say numbers slowly; pause after each.'),
  ('articulation', 'Pace and pauses', 'Deliver 4 key lines about your vision. Insert a 1-second pause after each. Target: composed pace, 130–150 wpm.', 75, 30, 3, 'en', 'Silence equals authority. Don''t fill it.'),
  ('posture', 'Check caméra — alignement', 'Placez-vous face caméra. Épaules alignées, menton parallèle au sol, regard objectif. Présentez-vous en 45 s en maintenant cette posture.', 45, 20, 1, 'fr', 'Caméra à hauteur des yeux, pas en plongée.'),
  ('posture', 'Gestes visibles', 'Présentez 3 priorités en gardant les mains visibles dans le cadre. Gestes ouverts, pas de bras croisés.', 60, 15, 2, 'fr', 'Gestes au-dessus de la taille, dans le cadre.'),
  ('posture', 'Regard caméra', 'Parlez 60 s en maintenant le contact visuel avec la lentille (pas l''écran). Comptez mentalement les ruptures de regard.', 60, 10, 3, 'fr', 'Notes hors caméra si besoin ; yeux sur la lentille.'),
  ('posture', 'Ancrage avant prise de parole', 'Avant de parler : 3 respirations, pieds ancrés, épaules basses. Puis ouvrez une réunion virtuelle en 45 s.', 45, 30, 2, 'fr', 'Le corps calme le débit.'),
  ('posture', 'Camera check — alignment', 'Face the camera. Shoulders level, chin parallel to floor, eyes on lens. Introduce yourself in 45s while holding that posture.', 45, 20, 1, 'en', 'Camera at eye level — never looking down.'),
  ('posture', 'Visible gestures', 'Present 3 priorities while keeping hands visible in frame. Open gestures, no crossed arms.', 60, 15, 2, 'en', 'Gesture above the waist, inside the frame.'),
  ('posture', 'Eye contact to lens', 'Speak for 60s maintaining eye contact with the lens (not the screen). Mentally count gaze breaks.', 60, 10, 3, 'en', 'Notes off-camera if needed; eyes on the lens.');
