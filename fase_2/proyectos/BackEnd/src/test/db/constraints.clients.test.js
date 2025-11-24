import { models } from "../../models/index.js";
import { v4 as uuid } from "uuid";

describe("clients constraints", () => {
  const RUT = "99999999-9";

  test("unique parcial por RUT (solo activos)", async () => {
    const id1 = uuid();
    await models.Client.create({
      id: id1,
      rut: RUT,
      name: "A",
      email: "a@test.cl",
      address: "x",
      phone: "+56912345678"
    });

    await expect(
      models.Client.create({
        id: uuid(),
        rut: RUT,
        name: "B",
        email: "b@test.cl",
        address: "y",
        phone: "+56987654321"
      })
    ).rejects.toThrow();

    await models.Client.update({ deleted_at: new Date() }, { where: { id: id1 }, paranoid: false });

    await expect(
      models.Client.create({
        id: uuid(),
        rut: RUT,
        name: "C",
        email: "c@test.cl",
        address: "z",
        phone: "+56955554444"
      })
    ).resolves.toBeTruthy();
  });
});
