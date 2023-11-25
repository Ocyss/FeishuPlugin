import { IOpenSegment, IFieldMeta, FieldType } from "@lark-base-open/js-sdk";
import type { FieldMaps } from "@/types";

// 多行文本转文本
export function TextFieldToStr(val: IOpenSegment[]) {
  return val
    .map((item: any) => item.text ?? item.name ?? item.enName ?? item.link)
    .join("");
}

export function fieldMaps(fieldMetaList: Array<IFieldMeta>) {
  return fieldMetaList.reduce(
    (acc: FieldMaps, obj: IFieldMeta) => {
      acc.NameToId[obj.name] = obj.id;
      acc.IdToName[obj.id] = obj.name;
      acc.IdToType[obj.id] = obj.type;
      return acc;
    },
    { NameToId: {}, IdToName: {}, IdToType: {} }
  );
}

export function fieldDefault(val: FieldType) {
  switch (val) {
    case FieldType.SingleSelect:
    case FieldType.Phone:
    case FieldType.Url:
    case FieldType.Text:
      return "";
    case FieldType.Number:
      return 0;
    case FieldType.MultiSelect:
      return [];
    case FieldType.DateTime:
      return 0;
    case FieldType.Checkbox:
      return false;
    case FieldType.User:
      return {
        id: "",
      };
    default:
      return "";
  }
}

export const FieldInfos: (
  type: FieldType
) => { name?: string; id: string }[] = (type) => {
  const f: <T extends object>(
    obj: Required<T>
  ) => {
    id: string;
  }[] = (obj) => {
    return Object.keys(obj).map((key) => ({
      id: key,
    }));
  };
  type AllProperties<T> = T extends any ? keyof T : never;
  type AllPropertiesTypes<T> = {
    [P in AllProperties<T>]: T extends { [K in P]?: infer U } ? U : never;
  };
  switch (type) {
    case FieldType.Text:
      return f<AllPropertiesTypes<IOpenSegment>>({
        id: "",
        text: "",
        name: "",
        enName: "",
        en_name: "",
        type: base.IOpenSegmentType.Text,
        link: "",
        token: "",
        mentionType: "User",
      });
    case FieldType.Number:
    case FieldType.DateTime:
    case FieldType.Checkbox:
    case FieldType.Phone:
      return [];
    case FieldType.SingleSelect:
    case FieldType.MultiSelect:
      return f<IOpenSingleSelect>({
        id: "",
        text: "",
      });
    case FieldType.User:
      return f<IOpenUser>({
        id: "",
        name: "",
        enName: "",
        email: "",
        en_name: "",
      });
    case FieldType.Url:
      return f<IOpenUrlSegment>({
        type: base.IOpenSegmentType.Url,
        text: "",
        link: "",
      });
    case FieldType.Attachment:
      return f<IOpenAttachment>({
        name: "",
        size: 0,
        type: "",
        token: "",
        timeStamp: 0,
      });
    case FieldType.DuplexLink:
      return f<IOpenLink>({
        text: "",
        type: "",
        recordIds: [],
        tableId: "",
        record_ids: [],
        table_id: "",
      });
    case FieldType.Location:
      return f<IOpenLocation>({
        address: "",
        adname: "",
        cityname: "",
        name: "",
        pname: "",
        fullAddress: "",
        location: "",
        full_address: "",
      });
    case FieldType.GroupChat:
      return f<IOpenGroupChat>({
        id: "",
        name: "",
        avatarUrl: "",
        enName: "",
        linkToken: "",
        en_name: "",
      });
  }
  return [{ id: "暂未支持该字段，请在交流群内反馈" }];
};
