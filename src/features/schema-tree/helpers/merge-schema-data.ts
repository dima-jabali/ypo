import type { DatabaseConnectionsSchema } from "#/contexts/databases-schema";
import { isRecord } from "#/helpers/utils";
import {
	EntityType,
	STANDARD_SCHEMA_KEYS_TO_ENTITY_TYPE,
	STANDARD_SCHEMA_KEYS_VALUES,
	StandardSchemaKeys,
	type Entity,
	type SchemaEntity,
} from "#/types/databases";

export const mergeSchemaData = (
	prev: DatabaseConnectionsSchema[],
	dbIndex: number,
	newSchema: DatabaseConnectionsSchema,
): DatabaseConnectionsSchema[] => {
	const prevSchemaData = prev[dbIndex];

	if (!prevSchemaData) {
		console.error("No prevSchemaData found!", { prev, dbIndex, newSchema });

		return prev;
	}

	const schemaToUpdate = { ...prevSchemaData };
	const next = [...prev];

	const objectToMerge =
		newSchema.schema.schema_info[StandardSchemaKeys.PARENT_ENTITY];
	const objectToMergeEntityType =
		objectToMerge && "entity_type" in objectToMerge
			? objectToMerge.entity_type
			: null;

	if (isOfTypeSchemaEntity(objectToMerge)) {
		console.error("Unimplemented parentEntity of type `SchemaEntity`!", {
			prevSchemaData,
			objectToMerge,
			newSchema,
		});

		return next;
	}

	if (!objectToMergeEntityType) {
		console.error("Unimplemented parentEntityType!", {
			objectToMergeEntityType,
			prevSchemaData,
			objectToMerge,
			newSchema,
		});

		return next;
	}

	// Find the parent entity and update it:
	for (const entityKeyAsString in schemaToUpdate.schema?.schema_info) {
		// Casting here because `entityKey` has the broader type `string` when looping with `in`:
		const entityKey = entityKeyAsString as StandardSchemaKeys;

		if (entityKey === StandardSchemaKeys.PARENT_ENTITY) continue;

		const entityType = STANDARD_SCHEMA_KEYS_TO_ENTITY_TYPE[entityKey];

		if (entityType !== objectToMergeEntityType) {
			// We still need to check if the parent_entity is inside one of these entities somewhere 🥲.

			const entities = schemaToUpdate.schema.schema_info[entityKey];

			standardSchemaLoop(entities, objectToMerge, entityType, newSchema);

			continue;
		}

		const entities = schemaToUpdate.schema.schema_info[entityKey];

		for (const entity of entities) {
			const isObjectToMerge =
				entity.name === objectToMerge.name && entity.id === objectToMerge.id;

			if (isObjectToMerge) {
				// TODO: this may be `entityType`:
				mergeDataInPlace(entity, entity.entity_type, newSchema);
			}
		}
	}

	next[dbIndex] = schemaToUpdate;

	return next;
};

const standardSchemaLoop = (
	entities: Entity[],
	parentEntity: Entity,
	entityType: EntityType,
	newSchema: DatabaseConnectionsSchema,
) => {
	for (const entity of entities) {
		for (const key in entity) {
			// Casting here because I want to know if `key` is one of `standardSchemaKeysValues`, but TypeScript complains because the type of `standardSchemaKeysValues` is narrow:
			if (!(STANDARD_SCHEMA_KEYS_VALUES as string[]).includes(key)) continue;

			// @ts-expect-error => I've made sure that `key` is one of `standardSchemaKeysValues` above.
			const innerEntities = entity[key] as Entity[];
			for (const innerEntity of innerEntities) {
				const hasFoundObjectToMerge =
					innerEntity.name === parentEntity.name &&
					innerEntity.id === parentEntity.id;

				if (hasFoundObjectToMerge) {
					mergeDataInPlace(innerEntity, entityType, newSchema);
				} else {
					// We still need to check if the parent_entity is inside one of these entities somewhere... one last time 🥲.

					const entities = Object.entries(innerEntity)
						// Casting here because I want to know if `key` is one of `standardSchemaKeysValues`, but TypeScript complains because the type of `standardSchemaKeysValues` is narrow:
						.filter(([key]) =>
							(STANDARD_SCHEMA_KEYS_VALUES as string[]).includes(key),
						)
						.map(([key, value]) => ({ [key]: value })) as unknown as Entity[];

					if (entities.length > 0) {
						standardSchemaLoop(
							entities,
							parentEntity,
							innerEntity.entity_type,
							newSchema,
						);
					}
				}
			}
		}
	}
};

const mergeDataInPlace = (
	innerEntity: Entity,
	entityType: EntityType,
	newSchema: DatabaseConnectionsSchema,
): void => {
	let newArraysToMerge: StandardSchemaKeys[];

	switch (entityType) {
		case EntityType.DATABASE:
			newArraysToMerge = [
				StandardSchemaKeys.SCHEMATA,
				StandardSchemaKeys.TABLES,
				StandardSchemaKeys.FIELDS,
			];
			break;

		case EntityType.SCHEMATA:
			newArraysToMerge = [StandardSchemaKeys.TABLES, StandardSchemaKeys.FIELDS];
			break;

		case EntityType.TABLE:
			newArraysToMerge = [StandardSchemaKeys.FIELDS];
			break;

		default:
			console.error("Unimplemented `EntityType`:", entityType);
			newArraysToMerge = [];
	}

	for (const field of newArraysToMerge) {
		Reflect.set(innerEntity, field, newSchema.schema.schema_info[field]);
	}
};

const isOfTypeSchemaEntity = (entity: unknown): entity is SchemaEntity =>
	isRecord(entity) && "schema" in entity;
