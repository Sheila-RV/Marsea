-- Reverts the interactive gym map feature: drops the branding/positioning
-- columns added for it. Any values already set are discarded (dev/demo data).
ALTER TABLE "Gym" DROP COLUMN "mapImageUrl";
ALTER TABLE "Discipline" DROP COLUMN "imageUrl";
ALTER TABLE "Discipline" DROP COLUMN "mapX";
ALTER TABLE "Discipline" DROP COLUMN "mapY";
