import { Modal } from '../Model'
import { IPaginate } from '../Type';
import { Model } from 'mongoose'
import ErrorCode from '../Constant/error';
export default class Paginate {
    options: IPaginate
    searchKeys: Array<string>
    _query: Array<{}>
    _modal: Model<any>

    constructor(modal: Model<any>, options: IPaginate, query: Array<{}>, searchKeys: Array<string>) {
        this.options = options as IPaginate
        this._query = query
        this.searchKeys = searchKeys
        this._modal = modal
    }

    private getSkip(): number {
        let options = <IPaginate>this.options
        let limit: number = options.limit
        let page: number = options.page
        if (page === 1) {
            return 0
        } else if (page > 1) {
            return (page * limit) - limit
        } else throw new Error(ErrorCode.BAD_REQUEST)
    }

    private generateFilters(): { [key: string]: any } | boolean {
        let options = this.options
        let filters: { [key: string]: any } = {}
        if (options.filter && Object.keys(options.filter).length) {
            for (let i in options.filter) {
                if (options.filter[i] === null || options.filter[i] === undefined || options.filter[i] === '')
                    continue
                if (typeof options.filter[i] === 'number' || typeof options.filter[i] === 'boolean') {
                    filters[i] = { $eq: options.filter[i] }
                } else if (typeof options.filter[i] === 'string') {
                    filters[i] = { $regex: options.filter[i], $options: 'i' }
                }
            }
            return filters
        } else return false
    }

    private generateSearchFilters(): Array<any> | boolean {
        let options = this.options
        let filters: Array<any> = new Array()
        if (options.searchKey) {
            options.searchKey = String(options.searchKey).replace('+91', '')
            for (let i in this.searchKeys) {
                filters.push({
                    [this.searchKeys[i]]: { $regex: options.searchKey, $options: 'i' }
                })
            }
            return filters
        } else return false
    }


    private generateSort(): { [key: string]: 1 | -1 } | boolean {
        let options = this.options
        let sorts: { [key: string]: 1 | -1 } = {}
        if (options.sort && Object.keys(options.sort).length) {
            for (let i in options.sort) {
                sorts[i] = options.sort[i]
            }
            return sorts
        } else return false
    }

    public async totalCount(query: any) {
        let countQuery = [
            ...query
        ]
        countQuery.push({
            $group: {
                _id: 'all',
                count: { $sum: 1 }
            }
        })
        return await this._modal.aggregate(countQuery).allowDiskUse(true)
    }

    public async run() {
        try {
            let query = this._query
            let filters = this.generateFilters()
            let sorts = this.generateSort()
            let skip = this.getSkip()
            let searchFilters = this.generateSearchFilters()
            let match = {}
            let count: any = 0
            if (filters) {
                match = filters
            }
            if (searchFilters) {
                match = {
                    ...match,
                    $or: searchFilters
                }
            }
            if (sorts) {
                query.push({
                    $sort: sorts
                })
            }
            if (match && Object.keys(match).length) {
                query.push({
                    $match: match
                })
            }
            count = await this.totalCount(query)
            if (skip && !this.options.export) {
                query.push({
                    $skip: skip
                })
            }
            if (this.options.limit > 0 && !this.options.export) {
                query.push({
                    $limit: this.options.limit
                })
            }
            return [await this._modal.aggregate(query).allowDiskUse(true), count && count.length > 0 ? count[0].count : 0]
        } catch (error: any) {
            throw error
        }
    }

}