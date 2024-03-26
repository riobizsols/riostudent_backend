import ExcelJS, { stream, Workbook, Worksheet } from "exceljs";
import https from "https";
import { fileUpload } from '../Library/AwsFileUpload'



export default class ExcelReport {
  workbook: Workbook;
  headers: Array<{
    header: string;
    key: string;
    width: number;
  }>;
  rowValues: Array<{}>;
  sheetName: string;
  fileName: string | undefined;
  constructor(
    headers: Array<{
      header: string;
      key: string;
      width: number;
    }>,
    rowValues: Array<{}>,
    sheetName: string,
    fileName?: string,
  ) {
    this.workbook = new ExcelJS.Workbook();
    this.headers = headers;
    this.rowValues = rowValues;
    this.workbook.created = new Date();
    this.sheetName = sheetName;
    this.fileName = fileName;

  }

  private addWorkSheet(): Worksheet {
    return this.workbook.addWorksheet(this.sheetName);
  }

  public async generateExcel() {
    try {
      let random = Math.floor(Math.random() * 1000000000 + 1);
      let fileName = this.fileName
      const worksheet: Worksheet = this.addWorkSheet();
      worksheet.columns = this.headers;
      worksheet.addRows(this.rowValues);
      const buffer = await this.workbook.xlsx.writeBuffer()
      const url = await fileUpload({
        buffer: buffer as Buffer,
        originalname: 'userlist.xlsx',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileName
      })
      return url;
    } catch (error) {
      throw error;
    }
  }

  static async getFile(fileName: string) {
    return new Promise((resolve, reject) => {
      https.get(fileName, (response) => {
        var data: any = [];
        response
          .on("data", (file: any) => data.push(file))
          .on("end", async () => {
            resolve(data);
          });
      });
    });
  }

  static async getDataFromExcel(file: any, sheetNumber?: number) {
    const workbook = new ExcelJS.Workbook();
    var readFile: any = await workbook.xlsx.read(file);
    var workSheet = workbook.worksheets[sheetNumber ? sheetNumber : 0];
    let data: any = [];
    let firstRow = workSheet.getRow(1);
    if (!firstRow.cellCount) return;
    let keys: any = firstRow.values;
    workSheet.eachRow((row, rowNumber) => {
      if (rowNumber == 1) return;
      let values: any = row.values;
      let obj: any = {};
      for (let i = 1; i < keys.length; i++) {
        obj[keys[i]] = values[i];
      }
      data.push(obj as {});
    });
    return data;
  }

  static async importTemplate() {
    try {

    } catch (error) {

    }
  }


}
