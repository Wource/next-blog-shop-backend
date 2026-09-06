"servet only";

import { Role } from "@/lib/api/shared/infrastructure/prisma/generated/enums";
import { Prisma } from "@/lib/api/shared/infrastructure/prisma/generated/client";

export type PrismaModel = keyof typeof Prisma.ModelName | "Self";

export type FieldName<M extends PrismaModel = PrismaModel> =
  keyof Prisma.TypeMap["model"][M extends "Self" ? "User" : M]["payload"]["scalars"] &
    string;

export type Action = "CREATE" | "READ" | "UPDATE" | "DELETE";

// role -> model -> table and field permissions
//
// A field uses the model's `actions` by default. If a field is present in
// `fields`, its actions replace the model actions (an empty array denies all
// actions for that field).
type ModelPermission<M extends PrismaModel> = {
  actions: Action[];
  fields?: Partial<Record<FieldName<M>, Action[]>>;
};

type GuardMap = Partial<
  Record<Role, Partial<{ [M in PrismaModel]: ModelPermission<M> }>>
>;

type UserActivityPermissions = Action[];

abstract class GaurdABC {
  protected static guardMap: GuardMap;

  static can<M extends PrismaModel>(
    role: Role,
    model: M,
    action: Action,
    field?: FieldName<M>,
  ) {
    if (role === "admin") return true;

    const permission =
      this.guardMap[role]?.[model] ??
      (role === "user" ? undefined : this.guardMap.user?.[model]);

    if (!permission) return false;

    const allowedActions =
      field !== undefined && permission.fields && field in permission.fields
        ? permission.fields[field] ?? []
        : permission.actions;

    return allowedActions.includes(action);
  }

  static getModelActions(
    role: Role,
    model: PrismaModel,
  ): UserActivityPermissions {
    if (role === "admin") return ["CREATE", "DELETE", "READ", "UPDATE"];
    const permission =
      this.guardMap[role]?.[model] ??
      (role === "user" ? undefined : this.guardMap.user?.[model]);
    return permission?.actions ?? [];
  }
}

export class Gaurd extends GaurdABC {
  static guardMap: GuardMap = {
    user: {
      Self: {
        actions: ["CREATE", "READ", "UPDATE"],
        fields: { name: ["CREATE", "READ", "UPDATE"] },
      },
      Comment: {
        actions: ["CREATE", "READ", "UPDATE"],
        fields: { status: [] },
      },
      Media: {
        actions: ["CREATE", "READ", "DELETE"],
      },
    },
  };
}
