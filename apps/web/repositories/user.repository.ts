import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export const userRepository = {
  async findByEmail(email: string) {
    return prisma.showroomUser.findUnique({ where: { email } })
  },

  async findById(id: string) {
    return prisma.showroomUser.findUnique({ where: { id } })
  },

  async findByNationalId(nationalId: string) {
    return prisma.showroomUser.findUnique({ where: { nationalId } })
  },

  async create(data: Prisma.ShowroomUserCreateInput) {
    return prisma.showroomUser.create({ data })
  },

  async update(id: string, data: Prisma.ShowroomUserUpdateInput) {
    return prisma.showroomUser.update({ where: { id }, data })
  },

  async addCompletedStep(id: string, step: string) {
    const user = await prisma.showroomUser.findUnique({ where: { id }, select: { completedSteps: true } })
    if (!user) return null
    if (user.completedSteps.includes(step)) return user
    return prisma.showroomUser.update({
      where: { id },
      data: { completedSteps: { set: [...user.completedSteps, step] } },
    })
  },
}
