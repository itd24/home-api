-- CreateTable
CREATE TABLE "Car" (
    "licencePlate" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Car_pkey" PRIMARY KEY ("licencePlate")
);

-- CreateTable
CREATE TABLE "Parking" (
    "id" SERIAL NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "carLicencePlate" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Parking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Parking_carLicencePlate_key" ON "Parking"("carLicencePlate");

-- AddForeignKey
ALTER TABLE "Parking" ADD CONSTRAINT "Parking_carLicencePlate_fkey" FOREIGN KEY ("carLicencePlate") REFERENCES "Car"("licencePlate") ON DELETE RESTRICT ON UPDATE CASCADE;
