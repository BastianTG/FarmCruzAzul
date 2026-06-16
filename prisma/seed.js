const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@cruzazul.com' },
    update: {},
    create: {
      nombre: 'Administrador',
      email: 'admin@cruzazul.com',
      passwordHash: '$2b$10$placeholder',
      rol: 'ADMIN',
    },
  })

  const proveedor = await prisma.proveedor.upsert({
    where: { id: 1 },
    update: {},
    create: {
      nombre: 'Distribuidora Farmacéutica SA de CV',
      contacto: 'Carlos López',
      telefono: '5551234567',
      email: 'carlos@distribuidora.com',
    },
  })

  console.log('Seed completed:', { admin: admin.email, proveedor: proveedor.nombre })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
