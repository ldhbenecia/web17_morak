import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Group, Member } from '@prisma/client';
import { MemberInformationDto } from 'src/member/dto/member.dto';
import { CreateGroupsDto } from './dto/create-groups.dto';

@Injectable()
export class GroupsRepository {
  constructor(private prisma: PrismaService) {}

  private async getGroupMembersCount(groupId: number): Promise<number> {
    return this.prisma.groupToUser.count({
      where: {
        groupId: groupId,
      },
    });
  }

  async getAllGroups(): Promise<(Group & { membersCount: number })[]> {
    const groups = await this.prisma.group.findMany();

    const groupPromises = groups.map(async (group) => {
      const membersCount = await this.getGroupMembersCount(Number(group.id));
      return { ...group, membersCount };
    });

    return Promise.all(groupPromises);
  }

  async getGroups(id: number): Promise<Group & { membersCount: number }> {
    const group = await this.prisma.group.findUnique({
      where: {
        id: id,
      },
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${id} not found.`);
    }

    const membersCount = await this.getGroupMembersCount(id);
    return { ...group, membersCount };
  }

  async getAllMembersOfGroup(groupId: number): Promise<MemberInformationDto[]> {
    const groupToUsers = await this.prisma.groupToUser.findMany({
      where: {
        groupId: groupId,
      },
      include: {
        user: true,
      },
    });

    return groupToUsers.map((groupToUser) => ({
      providerId: groupToUser.user.providerId,
      email: groupToUser.user.email,
      nickname: groupToUser.user.nickname,
      profilePicture: groupToUser.user.profilePicture,
    }));
  }

  async createGroups(createGroupsDto: CreateGroupsDto): Promise<Group> {
    try {
      const { title } = createGroupsDto;

      const group = await this.prisma.group.create({
        data: {
          title,
        },
      });

      return group;
    } catch (error) {
      throw new Error(`Failed to create group: ${error.message}`);
    }
  }

  async joinGroup(id: number, member: Member): Promise<void> {
    const group = await this.prisma.group.findUnique({
      where: { id },
    });

    if (!group) {
      throw new NotFoundException(`Group with id ${id} not found`);
    }

    const existingGroup = await this.prisma.groupToUser.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: member.id,
        },
      },
    });

    if (existingGroup) {
      throw new ForbiddenException(`Member with id ${member.id} is already participating in Group with id ${id}`);
    }

    await this.prisma.groupToUser.create({
      data: {
        groupId: group.id,
        userId: member.id,
      },
    });
  }

  async leaveGroup(groupId: number, member: Member): Promise<void> {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found.`);
    }

    const isMemberOfGroup = await this.prisma.groupToUser.findUnique({
      where: {
        groupId_userId: {
          groupId: groupId,
          userId: member.id,
        },
      },
    });

    if (!isMemberOfGroup) {
      throw new NotFoundException(`Member with ID ${member.id} is not a member of Group with ID ${groupId}.`);
    }

    await this.prisma.groupToUser.delete({
      where: {
        groupId_userId: {
          groupId: groupId,
          userId: member.id,
        },
      },
    });
  }

  async getMyGroups(member: Member): Promise<Group[]> {
    const groups = await this.prisma.groupToUser.findMany({
      where: { userId: member.id },
      include: {
        group: true,
      },
    });

    return groups.map((groupToUser) => groupToUser.group);
  }
}
