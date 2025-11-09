const supabase = require('../config/supabase');

class SupabaseService {
  // 通用查询方法
  static async query(table, options = {}) {
    try {
      let query = supabase.from(table).select(options.select || '*');
      
      // 添加过滤条件
      if (options.where) {
        Object.keys(options.where).forEach(key => {
          query = query.eq(key, options.where[key]);
        });
      }
      
      // 添加排序
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending !== false 
        });
      }
      
      // 添加分页
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`查询${table}表失败:`, error);
      throw error;
    }
  }

  // 插入数据
  static async insert(table, data) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select();
      
      if (error) throw error;
      return result[0];
    } catch (error) {
      console.error(`插入${table}表失败:`, error);
      throw error;
    }
  }

  // 更新数据
  static async update(table, id, data) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update({ ...data, updated_at: new Date() })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return result[0];
    } catch (error) {
      console.error(`更新${table}表失败:`, error);
      throw error;
    }
  }

  // 删除数据
  static async delete(table, id) {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error(`删除${table}表失败:`, error);
      throw error;
    }
  }

  // 批量操作
  static async batchInsert(table, dataArray) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(dataArray)
        .select();
      
      if (error) throw error;
      return result;
    } catch (error) {
      console.error(`批量插入${table}表失败:`, error);
      throw error;
    }
  }

  // 事务处理（Supabase自动处理事务）
  static async transaction(operations) {
    try {
      const results = [];
      for (const operation of operations) {
        const result = await operation();
        results.push(result);
      }
      return results;
    } catch (error) {
      console.error('事务处理失败:', error);
      throw error;
    }
  }

  // 文件存储操作
  static async uploadFile(bucket, filePath, file) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('文件上传失败:', error);
      throw error;
    }
  }

  static async getFileUrl(bucket, filePath) {
    try {
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      
      return data.publicUrl;
    } catch (error) {
      console.error('获取文件URL失败:', error);
      throw error;
    }
  }

  // 实时订阅
  static subscribe(table, event, callback) {
    return supabase
      .channel('custom-channel')
      .on(
        'postgres_changes',
        {
          event: event,
          schema: 'public',
          table: table
        },
        callback
      )
      .subscribe();
  }
}

module.exports = SupabaseService;
